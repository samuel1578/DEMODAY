'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, IdCard, LockKeyhole, ShieldCheck } from 'lucide-react'
import { OnboardingField } from '@/components/onboarding/fields'
import {
  displayName,
  formatValue,
  generateId,
  isMinor,
  loadProfile,
  saveProfile,
  validateStep,
  type ProfileRecord,
  type RoleId,
  type RoleFlow,
  type Values,
} from '@/lib/onboarding'

interface OnboardingFlowProps {
  role: RoleId
  flow: RoleFlow
  onExit: () => void
}

export function OnboardingFlow({ role, flow, onExit }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState<Values>(() => loadProfile(role)?.values ?? {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [record, setRecord] = useState<ProfileRecord | null>(null)

  const steps = useMemo(() => {
    const visible = flow.steps.filter(step => !step.when || step.when(values))
    return [...visible, { id: 'review', eyebrow: 'Final step', title: 'Review & submit.', intro: flow.intro, fields: [] }]
  }, [flow, values])
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const isReview = step.id === 'review'
  const isLast = !isReview && stepIndex === steps.length - 2
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)

  function setField(id: string, value: string) {
    setValues(previous => ({ ...previous, [id]: value }))
    setErrors(previous => {
      if (!previous[id]) return previous
      const next = { ...previous }
      delete next[id]
      return next
    })
  }

  function complete() {
    const saved: ProfileRecord = {
      role,
      id: generateId(role, values),
      values,
      photo: values.profilePhoto,
      completedAt: new Date().toISOString(),
      status: flow.status,
      statusNote: flow.statusNote,
    }
    saveProfile(saved)
    setRecord(saved)
  }

  function handleContinue() {
    if (isReview) {
      complete()
      return
    }
    const found = validateStep(step, values)
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }
    setErrors({})
    setStepIndex(index => index + 1)
  }

  function handleBack() {
    setErrors({})
    if (stepIndex === 0) onExit()
    else setStepIndex(index => index - 1)
  }

  if (record) return <div className="onboarding-flow"><SuccessScreen record={record} flow={flow} onExit={onExit} /></div>

  const reviewSections = steps.filter(item => item.id !== 'review').map(item => ({
    step: item,
    fields: item.fields.filter(field => values[field.id]),
  }))

  return (
    <div className="onboarding-flow grid gap-10 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow">{flow.label} onboarding</p>
        <h2 className="mt-3 text-2xl font-black uppercase leading-none tracking-tight">{flow.title}</h2>
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#F4D03F] transition-[width] duration-500" style={{ width: `${Math.max(6, progress)}%` }} />
        </div>
        <ol className="mt-6 flex flex-col gap-1">
          {steps.map((item, index) => {
            const state = index === stepIndex ? 'current' : index < stepIndex ? 'done' : 'todo'
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => index < stepIndex && setStepIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${state === 'current' ? 'bg-[#1e5128] text-white' : state === 'done' ? 'text-foreground/70 hover:bg-white/5' : 'text-foreground/35'}`}
                >
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${state === 'done' ? 'border-[#F4D03F] bg-[#F4D03F] text-[#172219]' : state === 'current' ? 'border-[#F4D03F] text-[#F4D03F]' : 'border-foreground/20'}`}>
                    {state === 'done' ? <Check className="size-3.5" /> : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="menu-type">{item.eyebrow} · {item.title.replace(/\.$/, '')}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="mt-6 flex items-start gap-3 rounded-md border border-foreground/10 bg-card p-4 text-xs leading-5 text-foreground/55">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#F4D03F]" />
          Demo mode — your answers stay in this browser. No data leaves your device.
        </div>
      </aside>

      <section className="rounded-xl border border-foreground/10 bg-card p-6 sm:p-9">
        {isReview ? (
          <div>
            <p className="eyebrow">Final step</p>
            <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight">Review & submit.</h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/60">{flow.intro}</p>
            <div className="mt-8 flex flex-col gap-5">
              {reviewSections.map(({ step: item, fields }) => (
                <div key={item.id} className="rounded-md border border-foreground/10 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4D03F]">{item.eyebrow} · {item.title}</span>
                    <button type="button" onClick={() => setStepIndex(steps.indexOf(item))} className="text-xs font-bold uppercase tracking-wider text-foreground/45 underline transition hover:text-[#F4D03F]">
                      Edit
                    </button>
                  </div>
                  <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {fields.map(field => (
                      <div key={field.id}>
                        <dt className="text-[10px] uppercase tracking-wider text-foreground/40">{field.label}</dt>
                        <dd className="mt-0.5 flex items-center gap-3 text-sm font-bold">
                          {field.type === 'photo' ? (
                            <>
                              <img src={values[field.id]} alt={field.label} className="size-10 rounded-full border border-foreground/15 object-cover" />
                              <span className="text-xs font-normal text-foreground/55">Uploaded</span>
                            </>
                          ) : (
                            formatValue(field, values[field.id] ?? '', values)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="eyebrow">{step.eyebrow}</p>
            <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight">{step.title}</h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/60">{step.intro}</p>
            {role === 'player' && step.id === 'athlete' && isMinor(values.dob) && (
              <p className="mt-4 flex items-start gap-2 rounded-md border border-[#E67E22]/40 bg-[#E67E22]/10 p-3 text-xs leading-5 text-foreground/70">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#E67E22]" />
                Under-18 registration detected. A guardian will confirm identity and consent before your account activates.
              </p>
            )}
            <div className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-2">
              {step.fields.map(field => (
                <OnboardingField
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ''}
                  values={values}
                  error={errors[field.id]}
                  onChange={value => setField(field.id, value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-foreground/10 pt-6">
          <button type="button" onClick={handleBack} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/55 transition hover:text-foreground">
            <ArrowLeft className="size-4" /> {stepIndex === 0 ? 'Back to roles' : 'Back'}
          </button>
          <button type="button" onClick={handleContinue} className="flex items-center gap-2 rounded-md bg-[#F4D03F] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#172219] transition hover:brightness-105">
            {isReview ? 'Submit application' : isLast ? 'Review' : 'Continue'} <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  )
}

function SuccessScreen({ record, flow, onExit }: { record: ProfileRecord; flow: RoleFlow; onExit: () => void }) {
  const name = displayName(record.role, record.values)
  const locked = record.role === 'scout'
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-foreground/10 bg-card p-8 text-center sm:p-12">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1e5128] text-[#F4D03F]">
        <Check className="size-7" />
      </span>
      <h2 className="mt-6 text-4xl font-black uppercase leading-none tracking-tight">
        {record.role === 'scout' ? 'Application received.' : 'Welcome to the network, ' + name.split(' ')[0] + '.'}
      </h2>
      <p className="mt-4 text-sm leading-6 text-foreground/60">{flow.intro}</p>

      <div className="mt-8 flex flex-col items-center gap-2 rounded-lg border border-[#F4D03F]/40 bg-[#1e5128]/20 p-6">
        {record.photo && <img src={record.photo} alt={name} className="size-20 rounded-full border-2 border-[#F4D03F] object-cover" />}
        <IdCard className="mt-1 text-[#F4D03F]" />
        <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">{flow.idLabel}</span>
        <strong className="font-mono text-2xl tracking-widest text-[#F4D03F]">{record.id}</strong>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-md border border-foreground/10 bg-background p-4 text-left text-xs leading-5 text-foreground/60">
        {locked ? <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#E67E22]" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#F4D03F]" />}
        <span>
          <b className="block text-foreground/80">{record.status}</b>
          {record.statusNote}
        </span>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={flow.dashboard} className="flex items-center justify-center gap-2 rounded-md bg-[#F4D03F] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#172219]">
          Open dashboard <ArrowRight className="size-4" />
        </Link>
        <button type="button" onClick={onExit} className="rounded-md border border-foreground/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-foreground/70 transition hover:border-[#F4D03F]">
          Register another role
        </button>
      </div>
    </div>
  )
}
