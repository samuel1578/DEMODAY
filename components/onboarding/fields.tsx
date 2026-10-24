'use client'

import { useRef, useState } from 'react'
import { Camera, Check, ImagePlus, Trash2 } from 'lucide-react'
import { fileToDataUrl, resolveOptions, type FieldDef, type Values } from '@/lib/onboarding'

interface FieldProps {
  field: FieldDef
  value: string
  values: Values
  error?: string
  onChange: (value: string) => void
}

const baseInput =
  'mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-[#F4D03F]'

function FieldLabel({ field, children }: { field: FieldDef; children?: React.ReactNode }) {
  return (
    <span className="flex items-baseline justify-between gap-3 text-xs font-bold uppercase tracking-wider">
      <span>
        {field.label}
        {field.required && <span className="ml-1 text-[#E67E22]">*</span>}
      </span>
      {children}
    </span>
  )
}

export function OnboardingField({ field, value, values, error, onChange }: FieldProps) {
  const options = resolveOptions(field, values)

  const shell = `flex flex-col ${field.span === 2 ? 'sm:col-span-2' : ''}`

  if (field.type === 'photo') return <PhotoField field={field} value={value} error={error} onChange={onChange} />

  if (field.type === 'choice')
    return (
      <div className={shell}>
        <FieldLabel field={field} />
        <div className={`mt-3 grid gap-2 ${options.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          {options.map(option => {
            const active = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-md border p-3 text-left transition ${active ? 'border-[#F4D03F] bg-[#1e5128] text-white' : 'border-foreground/12 bg-card hover:border-[#F4D03F]/60'}`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-bold">
                  {option.label}
                  {active && <Check className="size-4 shrink-0 text-[#F4D03F]" />}
                </span>
                {option.hint && <span className={`mt-1 block text-xs ${active ? 'text-white/65' : 'text-foreground/50'}`}>{option.hint}</span>}
              </button>
            )
          })}
        </div>
        {error && <FieldError message={error} />}
      </div>
    )

  if (field.type === 'multi')
    return (
      <div className={shell}>
        <FieldLabel field={field} />
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map(option => {
            const selected = value.split(',').filter(Boolean)
            const active = selected.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange(
                    active
                      ? selected.filter(item => item !== option.value).join(',')
                      : [...selected, option.value].join(','),
                  )
                }
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${active ? 'border-[#F4D03F] bg-[#F4D03F] text-[#172219]' : 'border-foreground/15 text-foreground/70 hover:border-[#F4D03F]/60'}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {error && <FieldError message={error} />}
      </div>
    )

  if (field.type === 'toggle' || field.type === 'consent') {
    const yes = value === 'yes'
    if (field.type === 'consent')
      return (
        <div className={shell}>
          <div className={`rounded-md border p-4 transition ${error ? 'border-[#E67E22]' : yes ? 'border-[#F4D03F]/70 bg-[#1e5128]/15' : 'border-foreground/12 bg-card'}`}>
            <button type="button" onClick={() => onChange(yes ? 'no' : 'yes')} className="flex w-full items-start gap-3 text-left">
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition ${yes ? 'border-[#F4D03F] bg-[#F4D03F] text-[#172219]' : 'border-foreground/25'}`}>
                {yes && <Check className="size-3.5" />}
              </span>
              <span>
                <FieldLabel field={field} />
                {field.hint && <span className="mt-2 block text-sm leading-6 text-foreground/60">{field.hint}</span>}
              </span>
            </button>
            {error && <FieldError message={error} />}
          </div>
        </div>
      )
    return (
      <div className={shell}>
        <FieldLabel field={field} />
        {field.hint && <span className="mt-1 block text-xs text-foreground/50">{field.hint}</span>}
        <div className="mt-3 inline-flex w-fit rounded-md border border-foreground/15 p-1">
          {['yes', 'no'].map(option => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${value === option ? 'bg-[#F4D03F] text-[#172219]' : 'text-foreground/55'}`}
            >
              {option}
            </button>
          ))}
        </div>
        {error && <FieldError message={error} />}
      </div>
    )
  }

  if (field.type === 'select')
    return (
      <label className={shell}>
        <FieldLabel field={field} />
        <select value={value} onChange={event => onChange(event.target.value)} className={baseInput}>
          <option value="">Select an option</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <FieldError message={error} />}
      </label>
    )

  if (field.type === 'textarea')
    return (
      <label className={shell}>
        <FieldLabel field={field} />
        <textarea rows={4} value={value} placeholder={field.placeholder} onChange={event => onChange(event.target.value)} className={`${baseInput} resize-y`} />
        {field.hint && <span className="mt-1 text-xs text-foreground/50">{field.hint}</span>}
        {error && <FieldError message={error} />}
      </label>
    )

  return (
    <label className={shell}>
      <FieldLabel field={field} />
      <input
        type={field.type === 'number' ? 'number' : field.type}
        value={value}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        onChange={event => onChange(event.target.value)}
        className={baseInput}
      />
      {field.hint && <span className="mt-1 text-xs text-foreground/50">{field.hint}</span>}
      {error && <FieldError message={error} />}
    </label>
  )
}

export function FieldError({ message }: { message: string }) {
  return <span className="mt-2 block text-xs font-bold text-[#E67E22]">{message}</span>
}

function PhotoField({ field, value, error, onChange }: Pick<FieldProps, 'field' | 'value' | 'error' | 'onChange'>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setLocalError(null)
    if (!file.type.startsWith('image/')) {
      setLocalError('Upload an image file (JPG, PNG or WebP).')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setLocalError('Keep images under 12MB.')
      return
    }
    setBusy(true)
    try {
      onChange(await fileToDataUrl(file))
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex flex-col ${field.span === 2 ? 'sm:col-span-2' : ''}`}>
      <FieldLabel field={field} />
      {field.hint && <span className="mt-1 text-xs text-foreground/50">{field.hint}</span>}
      <div className="mt-3 flex items-center gap-5 rounded-md border border-dashed border-foreground/20 bg-card p-5">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-foreground/15 bg-background">
          {value ? (
            <img src={value} alt={field.label} className="size-full object-cover" />
          ) : (
            <Camera className="size-7 text-foreground/30" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex w-fit items-center gap-2 rounded-md border border-foreground/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:border-[#F4D03F] disabled:opacity-50"
          >
            <ImagePlus className="size-4" />
            {busy ? 'Processing…' : value ? 'Replace photo' : 'Upload photo'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/45 transition hover:text-[#E67E22]">
              <Trash2 className="size-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      {(localError || error) && <FieldError message={localError ?? error ?? ''} />}
    </div>
  )
}
