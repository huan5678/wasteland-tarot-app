/**
 * Documentation Validation Script
 * Validates code examples in design system documentation
 */

import * as fs from 'fs'
import * as path from 'path'

const DOCS_DIR = path.join(process.cwd(), '.kiro/specs/fallout-utilitarian-design/design-system')
const GLOBALS_CSS = path.join(process.cwd(), 'src/app/globals.css')
const COMPONENTS_DIR = path.join(process.cwd(), 'src/components/ui')

interface ValidationResult {
  file: string
  errors: string[]
  warnings: string[]
}

const results: ValidationResult[] = []

// Read documentation files
function getDocFiles(): string[] {
  try {
    return fs.readdirSync(DOCS_DIR).filter((file) => file.endsWith('.md'))
  } catch (e) {
    console.error('Failed to read docs directory:', e)
    return []
  }
}

// Extract code blocks from markdown
function extractCodeBlocks(content: string): { lang: string; code: string }[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: { lang: string; code: string }[] = []
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      lang: match[1] || 'text',
      code: match[2],
    })
  }

  return blocks
}

// Extract CSS custom property references from code
function extractCSSVariables(code: string): string[] {
  const varRegex = /--[\w-]+/g
  const matches = code.match(varRegex) || []
  return [...new Set(matches)]
}

// Verify CSS variables exist in globals.css
function verifyCSSVariables(vars: string[], globalsCss: string): string[] {
  const missing: string[] = []

  for (const cssVar of vars) {
    if (!globalsCss.includes(cssVar)) {
      missing.push(cssVar)
    }
  }

  return missing
}

// Extract component references from code
function extractComponentReferences(code: string): string[] {
  const componentRegex = /<(Button|Input|Card|CardHeader|CardTitle|CardContent|CardFooter|LoadingState|EmptyState|Icon)/g
  const matches = code.match(componentRegex) || []
  return [...new Set(matches.map((m) => m.replace('<', '')))]
}

// Verify components exist
function verifyComponents(components: string[]): string[] {
  const missing: string[] = []

  for (const component of components) {
    const lowerComponent = component.toLowerCase()
    const componentPath = path.join(COMPONENTS_DIR, `${lowerComponent}.tsx`)

    if (!fs.existsSync(componentPath)) {
      missing.push(component)
    }
  }

  return missing
}

// Validate TypeScript/TSX syntax (basic validation)
function validateSyntax(code: string, lang: string): string[] {
  const errors: string[] = []

  if (lang === 'typescript' || lang === 'tsx' || lang === 'ts') {
    // Check for unmatched brackets
    const openBraces = (code.match(/{/g) || []).length
    const closeBraces = (code.match(/}/g) || []).length

    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`)
    }

    // Check for unmatched parentheses
    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length

    if (openParens !== closeParens) {
      errors.push(`Unmatched parentheses: ${openParens} opening, ${closeParens} closing`)
    }

    // Check for common React errors
    if (code.includes('class=') && !code.includes('className=')) {
      errors.push('Found "class=" instead of "className="')
    }

    if (code.includes('for=') && !code.includes('htmlFor=')) {
      errors.push('Found "for=" instead of "htmlFor="')
    }
  }

  return errors
}

// Main validation function
function validateDocumentation() {
  console.log('🔍 Validating design system documentation...\n')

  // Read globals.css
  let globalsCss = ''
  try {
    globalsCss = fs.readFileSync(GLOBALS_CSS, 'utf-8')
  } catch (e) {
    console.error('❌ Failed to read globals.css')
    process.exit(1)
  }

  // Get documentation files
  const docFiles = getDocFiles()

  if (docFiles.length === 0) {
    console.error('❌ No documentation files found')
    process.exit(1)
  }

  console.log(`Found ${docFiles.length} documentation files\n`)

  // Validate each documentation file
  for (const docFile of docFiles) {
    const filePath = path.join(DOCS_DIR, docFile)
    const content = fs.readFileSync(filePath, 'utf-8')

    const result: ValidationResult = {
      file: docFile,
      errors: [],
      warnings: [],
    }

    // Extract and validate code blocks
    const codeBlocks = extractCodeBlocks(content)

    console.log(`📄 ${docFile}: ${codeBlocks.length} code blocks`)

    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i]

      // Validate syntax
      const syntaxErrors = validateSyntax(block.code, block.lang)
      if (syntaxErrors.length > 0) {
        result.errors.push(`Code block ${i + 1} (${block.lang}): ${syntaxErrors.join(', ')}`)
      }

      // Validate CSS variables
      if (block.lang === 'css' || block.lang === 'typescript' || block.lang === 'tsx') {
        const cssVars = extractCSSVariables(block.code)
        const missingVars = verifyCSSVariables(cssVars, globalsCss)

        if (missingVars.length > 0) {
          result.warnings.push(
            `Code block ${i + 1}: CSS variables not found in globals.css: ${missingVars.join(', ')}`
          )
        }
      }

      // Validate component references
      if (block.lang === 'tsx' || block.lang === 'jsx') {
        const components = extractComponentReferences(block.code)
        const missingComponents = verifyComponents(components)

        if (missingComponents.length > 0) {
          result.warnings.push(
            `Code block ${i + 1}: Components not found: ${missingComponents.join(', ')}`
          )
        }
      }
    }

    results.push(result)
  }

  // Print results
  console.log('\n' + '='.repeat(80))
  console.log('📊 VALIDATION RESULTS')
  console.log('='.repeat(80) + '\n')

  let totalErrors = 0
  let totalWarnings = 0

  for (const result of results) {
    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log(`\n📄 ${result.file}`)

      if (result.errors.length > 0) {
        console.log(`  ❌ ${result.errors.length} error(s):`)
        result.errors.forEach((error) => console.log(`     - ${error}`))
        totalErrors += result.errors.length
      }

      if (result.warnings.length > 0) {
        console.log(`  ⚠️  ${result.warnings.length} warning(s):`)
        result.warnings.forEach((warning) => console.log(`     - ${warning}`))
        totalWarnings += result.warnings.length
      }
    } else {
      console.log(`✅ ${result.file} - All code examples valid`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total files checked: ${results.length}`)
  console.log(`Total errors: ${totalErrors}`)
  console.log(`Total warnings: ${totalWarnings}`)

  if (totalErrors > 0) {
    console.log('\n❌ Validation failed with errors')
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  Validation passed with warnings')
  } else {
    console.log('\n✅ All documentation validated successfully!')
  }
}

// Run validation
validateDocumentation()
