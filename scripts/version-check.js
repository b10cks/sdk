#!/usr/bin/env node

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

async function checkVersionConsistency() {
    const packagesDir = join(process.cwd(), 'packages')
    const packages = await readdir(packagesDir)

    const packageVersions = new Map()
    const dependencies = new Map()

    // Read all package.json files
    for (const pkg of packages) {
        const packageJsonPath = join(packagesDir, pkg, 'package.json')
        try {
            const content = await readFile(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(content)

            packageVersions.set(packageJson.name, packageJson.version)
            dependencies.set(packageJson.name, {
                dependencies: packageJson.dependencies || {},
                devDependencies: packageJson.devDependencies || {}
            })
        } catch (error) {
            console.warn(`Could not read package.json for ${pkg}:`, error.message)
        }
    }

    console.log('📦 Package Versions:')
    for (const [name, version] of packageVersions) {
        console.log(`  ${name}: ${version}`)
    }

    console.log('\n🔗 Cross-dependencies:')
    let hasIssues = false

    for (const [packageName, deps] of dependencies) {
        const allDeps = { ...deps.dependencies, ...deps.devDependencies }

        for (const [depName, depVersion] of Object.entries(allDeps)) {
            if (packageVersions.has(depName)) {
                if (depVersion === 'workspace:*') {
                    console.log(`  ✅ ${packageName} -> ${depName}: ${depVersion}`)
                } else {
                    console.log(`  ⚠️  ${packageName} -> ${depName}: ${depVersion} (should be workspace:*)`)
                    hasIssues = true
                }
            }
        }
    }

    if (hasIssues) {
        console.log('\n❌ Found version inconsistencies!')
        process.exit(1)
    } else {
        console.log('\n✅ All versions are consistent!')
    }
}

checkVersionConsistency().catch(console.error)
