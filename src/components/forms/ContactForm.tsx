'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  contactFormSchema,
  type ContactFormData,
  CONTACT_CATEGORIES,
} from '@/lib/contactFormSchema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * Contact Form Component
 * 聯絡表單元件
 *
 * @description
 * Client-side form component with:
 * - React Hook Form for state management
 * - Zod validation schema integration
 * - Real-time field validation
 * - Fallout-themed success message
 * - Form reset after successful submission
 *
 * @example
 * ```tsx
 * <ContactForm />
 * ```
 *
 * @component
 * @since 1.0.0
 */
export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  /**
   * Handle form submission
   * 處理表單提交
   */
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      // Simulate API call (replace with actual API endpoint)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Log form data (in production, send to backend API)
      console.log('Contact form submitted:', data);

      // Show success message
      setSubmitSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        reset();
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Form submission error:', error);
      // TODO: Add error handling UI
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Success Message */}
      {submitSuccess && (
        <div
          className="mb-6 border-2 border-green-600 bg-green-950/50 p-4 animate-pulse"
          role="alert"
          aria-live="polite"
        >
          <div className="mb-2 flex items-center text-green-400">
            <span className="mr-2 text-xl" aria-hidden="true">
              ✓
            </span>
            <span className="font-bold">
              [TRANSMISSION SUCCESSFUL]
            </span>
          </div>
          <p className="text-sm text-green-500">
            您的訊息已送達避難所控制中心！我們會盡快回覆您。
          </p>
          <p className="mt-2 text-xs text-green-700">
            &gt;&gt; Signal strength: 100% | Encryption: AES-256
          </p>
        </div>
      )}

      {/* Contact Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 border-2 border-green-800 bg-black/80 p-6"
        noValidate
      >
        {/* Form Header */}
        <div className="border-b-2 border-green-900 pb-4">
          <h2 className="text-xl font-bold text-green-400">
            <span className="text-green-700" aria-hidden="true">
              &gt;&gt;{' '}
            </span>
            聯絡表單
          </h2>
          <p className="mt-2 text-sm text-green-600">
            請填寫以下資訊，我們會在 24 小時內回覆您的訊息。
          </p>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-green-500">
            <span className="text-green-700" aria-hidden="true">
              [{' '}
            </span>
            姓名
            <span className="text-green-700" aria-hidden="true">
              {' '}]
            </span>
            <span className="ml-1 text-red-500" aria-label="必填欄位">
              *
            </span>
          </Label>
          <Input
            id="contact-name"
            type="text"
            placeholder="請輸入您的姓名"
            errorMessage={errors.name?.message}
            disabled={isSubmitting}
            {...register('name')}
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-email" className="text-green-500">
            <span className="text-green-700" aria-hidden="true">
              [{' '}
            </span>
            電子郵件
            <span className="text-green-700" aria-hidden="true">
              {' '}]
            </span>
            <span className="ml-1 text-red-500" aria-label="必填欄位">
              *
            </span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="your.email@wasteland.vault"
            errorMessage={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-category" className="text-green-500">
            <span className="text-green-700" aria-hidden="true">
              [{' '}
            </span>
            問題類別
            <span className="text-green-700" aria-hidden="true">
              {' '}]
            </span>
            <span className="ml-1 text-red-500" aria-label="必填欄位">
              *
            </span>
          </Label>
          <select
            id="contact-category"
            className={`input-terminal flex w-full rounded-md border px-3 py-2 text-base shadow-sm md:text-sm transition-all duration-200 outline-none focus:outline-2 focus:outline-offset-1 focus:shadow-[0_0_0_3px_var(--color-input-focus-ring)] bg-[var(--color-input-bg)] text-[var(--color-input-fg)] ${
              errors.category
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)]'
                : 'border-[var(--color-input-border)] focus:border-[var(--color-input-border-focus)]'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isSubmitting}
            aria-invalid={errors.category ? 'true' : undefined}
            aria-describedby={
              errors.category ? 'contact-category-error' : undefined
            }
            {...register('category')}
          >
            <option value="">請選擇問題類別</option>
            {CONTACT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p
              id="contact-category-error"
              className="mt-1.5 text-sm text-error"
              role="alert"
            >
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <Label htmlFor="contact-message" className="text-green-500">
            <span className="text-green-700" aria-hidden="true">
              [{' '}
            </span>
            訊息內容
            <span className="text-green-700" aria-hidden="true">
              {' '}]
            </span>
            <span className="ml-1 text-red-500" aria-label="必填欄位">
              *
            </span>
          </Label>
          <Textarea
            id="contact-message"
            placeholder="請輸入您的問題或建議（至少 20 個字元）..."
            rows={6}
            errorMessage={errors.message?.message}
            disabled={isSubmitting}
            {...register('message')}
          />
          <p className="text-xs text-green-700">
            <span aria-hidden="true">&gt;</span> 最少 20 字元，最多
            1000 字元
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between border-t-2 border-green-900 pt-6">
          <p className="text-xs text-green-700">
            <span className="text-red-500">*</span> 為必填欄位
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[200px] bg-green-700 text-black hover:bg-green-600 disabled:bg-green-900 disabled:text-green-700"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 animate-spin" aria-hidden="true">
                  ◌
                </span>
                傳送中...
              </>
            ) : (
              <>
                <span className="mr-2" aria-hidden="true">
                  ▶
                </span>
                送出訊息
              </>
            )}
          </Button>
        </div>

        {/* Terminal Status Line */}
        <div className="border-t border-green-900 pt-4 text-xs text-green-800">
          <p>
            <span aria-hidden="true">&gt;&gt;&gt;</span> SYSTEM STATUS:{' '}
            {isSubmitting ? 'TRANSMITTING...' : 'READY'}
          </p>
        </div>
      </form>
    </div>
  );
}
