'use client'
import React from 'react'
import { getLayout } from '@/lib/spreadLayouts'

interface Props {
  spreadType: string
}

export function SpreadLayoutPreview({ spreadType }: Props) {
  const layout = getLayout(spreadType)
  return (
    <div className="w-full h-40 relative border border-pip-boy-green/30 bg-pip-boy-green/5">
      {layout.map(pos => (
        <div
          key={pos.id}
            className="absolute w-10 h-14 border-2 border-pip-boy-green/40 bg-pip-boy-green/10 flex items-center justify-center text-[10px] text-pip-boy-green"
          style={{
            left: `${pos.x * 100}%`,
            top: `${pos.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {pos.label}
        </div>
      ))}
    </div>
  )
}
