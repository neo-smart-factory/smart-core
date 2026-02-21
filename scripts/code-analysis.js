#!/usr/bin/env node

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY — Pre-Compilation Code Analysis
 *  Catches common Solidity issues BEFORE running hardhat compile.
 *
 *  Usage: node scripts/code-analysis.js
 *         make analyze
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const IGNORE_DIRS = ['ton', 'usdgo-token'];

const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
};

// ═══════════════════════════════════════════════════════
// File Discovery
// ═══════════════════════════════════════════════════════

function findSolFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (IGNORE_DIRS.includes(entry.name) || entry.name === 'node_modules' || entry.name === 'build') continue;
            findSolFiles(fullPath, files);
        } else if (entry.name.endsWith('.sol')) {
            files.push(fullPath);
        }
    }
    return files;
}

// ═══════════════════════════════════════════════════════
// Analysis Rules
// ═══════════════════════════════════════════════════════

const rules = [
    {
        id: 'STRAY_CHAR',
        severity: 'error',
        description: 'Stray characters outside of code blocks (quotes, backticks)',
        check(lines, filePath) {
            const issues = [];
            let inComment = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // Track multiline comments
                if (line.includes('/*')) inComment = true;
                if (line.includes('*/')) { inComment = false; continue; }
                if (inComment || line.startsWith('//') || line.startsWith('*')) continue;
                // Check for stray single quotes on their own line
                if (/^['"`]$/.test(line)) {
                    issues.push({ line: i + 1, message: `Stray character '${line}' found on its own line` });
                }
            }
            return issues;
        },
    },

    {
        id: 'RETURN_PARAM_SHADOW',
        severity: 'error',
        description: 'Named return parameters shadowing inherited functions (name, symbol, etc.)',
        check(lines, filePath) {
            const issues = [];
            const shadowKeywords = ['name', 'symbol', 'decimals', 'totalSupply', 'balanceOf', 'owner'];
            let inReturns = false;
            let parenDepth = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Detect "returns (" pattern
                if (/\)\s*returns\s*\(/.test(line) || /^\s*returns\s*\(/.test(line)) {
                    inReturns = true;
                    parenDepth = 0;
                }
                if (inReturns) {
                    parenDepth += (line.match(/\(/g) || []).length;
                    parenDepth -= (line.match(/\)/g) || []).length;
                    // Check for shadowing inside return params
                    for (const kw of shadowKeywords) {
                        const regex = new RegExp(`\\bmemory\\s+${kw}\\b|\\b${kw}\\s*,|\\b${kw}\\s*\\)`, 'g');
                        if (regex.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                            issues.push({
                                line: i + 1,
                                message: `Return parameter '${kw}' may shadow inherited function. Rename to e.g. 'token${kw.charAt(0).toUpperCase() + kw.slice(1)}'`,
                            });
                        }
                    }
                    if (parenDepth <= 0) inReturns = false;
                }
            }
            return issues;
        },
    },

    {
        id: 'NATSPEC_EMAIL',
        severity: 'error',
        description: 'Email-like addresses in NatSpec comments using @ (parsed as tags)',
        check(lines, filePath) {
            const issues = [];
            let inComment = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes('/*') || line.startsWith('/**')) inComment = true;
                if (inComment || line.startsWith('*') || line.startsWith('//')) {
                    // Check for @ that's NOT a known NatSpec tag
                    const validTags = ['@title', '@notice', '@dev', '@param', '@return', '@custom', '@inheritdoc', '@author'];
                    const atMatches = line.match(/@\w+/g) || [];
                    for (const match of atMatches) {
                        if (!validTags.some(tag => match.startsWith(tag.replace('@', '@')))) {
                            // Check if it looks like email (has dots after @)
                            const fullMatch = line.match(new RegExp(`${match.replace('@', '@')}[\\w.]*`));
                            if (fullMatch && fullMatch[0].includes('.')) {
                                issues.push({
                                    line: i + 1,
                                    message: `'${fullMatch[0]}' in NatSpec comment will break compilation. Use '[at]' instead of '@'`,
                                });
                            }
                        }
                    }
                }
                if (line.includes('*/')) inComment = false;
            }
            return issues;
        },
    },

    {
        id: 'NATSPEC_RETURN_MISMATCH',
        severity: 'warning',
        description: '@return tag names not matching actual return parameter names',
        check(lines, filePath) {
            const issues = [];
            let commentBlock = [];
            let inComment = false;
            let commentStart = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('/**')) {
                    inComment = true;
                    commentBlock = [];
                    commentStart = i;
                }
                if (inComment) {
                    commentBlock.push(line);
                }
                if (line.includes('*/') && inComment) {
                    inComment = false;
                    // Look at the next function declaration for returns
                    const returnTags = commentBlock
                        .filter(l => l.includes('@return'))
                        .map(l => {
                            const match = l.match(/@return\s+(\w+)/);
                            return match ? match[1] : null;
                        })
                        .filter(Boolean);

                    if (returnTags.length > 0) {
                        // Find the function's return params
                        let funcLines = '';
                        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                            funcLines += lines[j] + ' ';
                            if (lines[j].includes('{')) break;
                        }
                        const returnMatch = funcLines.match(/returns\s*\(([^)]+)\)/);
                        if (returnMatch) {
                            const paramNames = returnMatch[1]
                                .split(',')
                                .map(p => p.trim().split(/\s+/).pop())
                                .filter(Boolean);

                            for (const tag of returnTags) {
                                if (!paramNames.includes(tag)) {
                                    issues.push({
                                        line: commentStart + 1,
                                        message: `@return '${tag}' doesn't match any return parameter. Actual params: [${paramNames.join(', ')}]`,
                                    });
                                }
                            }
                        }
                    }
                }
            }
            return issues;
        },
    },

    {
        id: 'MISSING_PRAGMA',
        severity: 'warning',
        description: 'Missing or inconsistent pragma solidity version',
        check(lines, filePath) {
            const issues = [];
            const hasPragma = lines.some(l => l.trim().startsWith('pragma solidity'));
            if (!hasPragma) {
                issues.push({ line: 1, message: 'Missing pragma solidity declaration' });
            }
            return issues;
        },
    },

    {
        id: 'TRANSFER_PATTERN',
        severity: 'warning',
        description: 'Using .transfer() instead of .call() for ETH transfers',
        check(lines, filePath) {
            const issues = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('.transfer(') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                    // Check if it's an ERC20 transfer (token.transfer) or ETH transfer (payable.transfer)
                    if (line.includes('payable(') || line.includes('.transfer(address(this).balance)')) {
                        issues.push({
                            line: i + 1,
                            message: 'Using .transfer() for ETH. Consider .call{value: }("") for forward-compatibility with gas changes',
                        });
                    }
                }
            }
            return issues;
        },
    },
];

// ═══════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════

function analyze() {
    console.log(`\n${COLORS.bold}${COLORS.cyan}  ⚡ NΞØ Code Analysis — Pre-Compilation Check${COLORS.reset}\n`);

    const files = findSolFiles(CONTRACTS_DIR);
    console.log(`${COLORS.dim}  Scanning ${files.length} Solidity files...${COLORS.reset}\n`);

    let totalErrors = 0;
    let totalWarnings = 0;
    const fileIssues = [];

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const relPath = path.relative(path.join(__dirname, '..'), filePath);
        const issues = [];

        for (const rule of rules) {
            const ruleIssues = rule.check(lines, filePath);
            for (const issue of ruleIssues) {
                issues.push({ ...issue, ruleId: rule.id, severity: rule.severity, description: rule.description });
            }
        }

        if (issues.length > 0) {
            fileIssues.push({ file: relPath, issues });
            for (const issue of issues) {
                if (issue.severity === 'error') totalErrors++;
                else totalWarnings++;
            }
        }
    }

    // Output results
    if (fileIssues.length === 0) {
        console.log(`  ${COLORS.green}✅ All ${files.length} contracts passed analysis. Ready to compile!${COLORS.reset}\n`);
        return 0;
    }

    for (const { file, issues } of fileIssues) {
        console.log(`  ${COLORS.bold}${file}${COLORS.reset}`);
        for (const issue of issues) {
            const severity = issue.severity === 'error'
                ? `${COLORS.red}ERROR${COLORS.reset}`
                : `${COLORS.yellow}WARN${COLORS.reset}`;
            console.log(`    ${severity} L${issue.line}: [${issue.ruleId}] ${issue.message}`);
        }
        console.log('');
    }

    console.log(`  ${COLORS.bold}Summary:${COLORS.reset} ${COLORS.red}${totalErrors} errors${COLORS.reset}, ${COLORS.yellow}${totalWarnings} warnings${COLORS.reset}`);
    console.log(`  ${COLORS.dim}Run 'npx hardhat compile' only after resolving all errors.${COLORS.reset}\n`);

    return totalErrors > 0 ? 1 : 0;
}

// Run
const exitCode = analyze();
process.exit(exitCode);
