/**
 * Register Page 測試 - 驗證使用 RegisterForm 元件
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RegisterPage from '../page'
import fs from 'fs'
import path from 'path'

describe('RegisterPage - Component Usage', () => {
  it('頁面應該使用 RegisterForm 元件', () => {
    // 檢查頁面原始碼是否使用 RegisterForm
    const pagePath = path.join(
      process.cwd(),
      'src/app/auth/register/page.tsx'
    )
    const pageSource = fs.readFileSync(pagePath, 'utf-8')

    // 應該使用 RegisterForm
    expect(pageSource).toContain('<RegisterForm />')
  })

  it('應該是簡潔的頁面實作（少於 50 行）', () => {
    const pagePath = path.join(
      process.cwd(),
      'src/app/auth/register/page.tsx'
    )
    const pageSource = fs.readFileSync(pagePath, 'utf-8')
    const lineCount = pageSource.split('\n').length

    // 頁面應該很簡潔，只是使用元件
    expect(lineCount).toBeLessThan(50)
  })

  it('應該包含 metadata', () => {
    const pagePath = path.join(
      process.cwd(),
      'src/app/auth/register/page.tsx'
    )
    const pageSource = fs.readFileSync(pagePath, 'utf-8')

    // 檢查是否有 metadata export
    expect(pageSource).toContain('export const metadata')
    expect(pageSource).toContain('Metadata')
  })

  it('不應該包含直接實作的表單邏輯', () => {
    const pagePath = path.join(
      process.cwd(),
      'src/app/auth/register/page.tsx'
    )
    const pageSource = fs.readFileSync(pagePath, 'utf-8')

    // 不應該有 useState, handleSubmit 等直接實作
    expect(pageSource).not.toContain('const [formData')
    expect(pageSource).not.toContain('const handleSubmit')
    expect(pageSource).not.toContain('const validateForm')
  })

  it('應該使用 RegisterForm 元件', () => {
    const pagePath = path.join(
      process.cwd(),
      'src/app/auth/register/page.tsx'
    )
    const pageSource = fs.readFileSync(pagePath, 'utf-8')

    // 應該 import 和使用 RegisterForm
    expect(pageSource).toContain('RegisterForm')
    expect(pageSource).toContain('from')
  })
})
