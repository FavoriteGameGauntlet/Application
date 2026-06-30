import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const version = process.env.npm_package_version

const tauriConfPath = 'src-tauri/tauri.conf.json'
const cargoTomlPath = 'src-tauri/Cargo.toml'

const tauriConf = readFileSync(tauriConfPath, 'utf8')
writeFileSync(tauriConfPath, tauriConf.replace(/"version": "[^"]+"/, `"version": "${version}"`))

const cargoToml = readFileSync(cargoTomlPath, 'utf8')
writeFileSync(cargoTomlPath, cargoToml.replace(/^version = "[^"]+"/m, `version = "${version}"`))

execSync('cargo update -p fgg', { cwd: 'src-tauri' })

execSync(`git add ${tauriConfPath} ${cargoTomlPath} src-tauri/Cargo.lock`)
