const { compileFunc } = require('@ton-community/func-js');
const fs = require('fs');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, '../contracts/ton');
const BUILD_DIR = path.join(__dirname, '../artifacts/ton');

const targets = [
    'NeoJettonMinter.fc',
    'NeoJettonWallet.fc',
    'NeoJettonFactory.fc'
];

async function main() {
    console.log('🚀 Starting TON Compilation...');

    if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    const readSource = (filePath) => {
        // Handle absolute paths
        if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }

        // Handle relative paths from include
        const fullPath = path.join(CONTRACTS_DIR, filePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf8');
        }

        return null;
    };

    let hasErrors = false;

    for (const target of targets) {
        process.stdout.write(`Compiling ${target}... `);

        try {
            const result = await compileFunc({
                targets: [path.join(CONTRACTS_DIR, target)],
                sources: (p) => {
                    console.log(`[DEBUG] Requesting source: ${p}`);
                    // Inject stdlib if requested
                    if (p.endsWith('stdlib.fc')) {
                        return `
                        ;; Cleaned Minimal Stdlib Level 4
                        
                        ;; Tuple
                        forall X -> tuple single(X x) asm "SINGLE";
                        forall X -> (tuple, ()) ~tpush(tuple t, X x) asm "TPUSH";
                        forall X -> (tuple, X) ~tpop(tuple t) asm "TPOP";
                        
                        ;; Cell/Slice/Builder basic
                        builder begin_cell() asm "NEWC";
                        cell end_cell(builder b) asm "ENDC";
                        slice begin_parse(cell c) asm "CTOS";
                        
                        ;; Loads
                        (slice, cell) load_ref(slice s) asm "LDREF";
                        (slice, cell) load_dict(slice s) asm "LDDICT";
                        (slice, int) load_coins(slice s) asm "LDGRAMS";
                        (slice, slice) load_msg_addr(slice s) asm "LDMSGADDR";
                        (slice, ()) skip_bits(slice s, int len) asm "SDSKIPFIRST";
                        
                        ;; Stores
                        builder store_slice(builder b, slice s) asm "STSLICER";
                        builder store_dict(builder b, cell c) asm "STDICT";
                        builder store_coins(builder b, int x) asm "STGRAMS";
                        builder store_ref(builder b, cell c) asm "STREF";
                        
                        ;; Utils
                        int cell_hash(cell c) asm "HASHCU";
                        int min(int x, int y) asm "MIN";
                        (int, int) parse_std_addr(slice s) asm "REWRITESTDADDR";
                        int string_hash(slice s) asm "ZKWHASH";
                        () send_raw_message(cell msg, int mode) asm "SENDMSG";
                        slice my_address() asm "MYADDR";
                        int my_balance() asm "BALANCE";
                        int slice_hash(slice s) asm "HASHSU";
                        
                        ;; More missing builtins
                        int slice_refs(slice s) asm "SREFS";
                        int slice_empty?(slice s) asm "SEMPTY";
                        
                        ;; Dict U/I variants
                        (cell, ()) ~udict_set(cell dict, int key_len, int index, slice value) asm(value index dict key_len) "DICTUSET";
                        (slice, int) udict_get?(cell dict, int key_len, int index) asm(index dict key_len) "DICTUGET" "NULLSWAPIFNOT";

                        
                        ;; Exception
                        ;; throw/throw_if/unless are built-in now
                        
                        
                        ;; Data
                        cell get_data() asm "c4 PUSH";
                        () set_data(cell c) asm "c4 POP";
                        
                        ;; Dict Helper
                        (cell, int) dict_get_ref(cell dict, int key_len, slice index) asm(index dict key_len) "DICTGETREF" "NULLSWAPIFNOT";
                        (cell, int) dict_set(cell dict, int key_len, slice index, slice value) asm(value index dict key_len) "DICTSET";
                         cell new_dict() asm "NEWDICT";
                         
                         ;; Tuple items
                        tuple first(tuple t) asm "FIRST";
                        tuple second(tuple t) asm "SECOND";
                        tuple third(tuple t) asm "THIRD";
                        tuple fourth(tuple t) asm "FOURTH";
                        
                        ;; Comparison
                        int equal_slices(slice a, slice b) asm "SDEQ";
                        `;
                    }

                    const content = readSource(p);
                    if (!content) {
                        if (!p.endsWith('stdlib.fc')) {
                            console.error(`\nCould not find source file: ${p}`);
                        }
                    }
                    return content || '';
                }
            });

            if (result.status === 'error') {
                console.log(`❌ FAILED`);
                console.error(result.message);
                hasErrors = true;
            } else {
                const b64 = result.codeBoc;
                const outFile = path.join(BUILD_DIR, target.replace('.fc', '.cell'));
                const jsonFile = path.join(BUILD_DIR, target.replace('.fc', '.json'));

                fs.writeFileSync(outFile, Buffer.from(b64, 'base64'));
                fs.writeFileSync(jsonFile, JSON.stringify({
                    doc: 'NΞØ Protocol Compiled Contract',
                    compiler: 'func-js',
                    target: target,
                    boc: b64,
                    hash: result.hash
                }, null, 2));

                console.log(`✅ OK`);
            }
        } catch (e) {
            console.log(`❌ CRITICAL ERROR`);
            console.error(e);
            hasErrors = true;
        }
    }

    if (hasErrors) {
        console.error('\n⚠️  Compilation failed for some contracts.');
        process.exit(1);
    } else {
        console.log('\n✨ All contracts compiled successfully!');
    }
}

main();
