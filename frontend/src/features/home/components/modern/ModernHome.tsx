'use client'

import React from 'react'
import { ModernHero } from './ModernHero'
import { ModernProducts } from './ModernProducts'
import { ModernAi } from './ModernAi'
import { ModernServices } from './ModernServices'
import { ModernAbout } from './ModernAbout'

export function ModernHome() {
  return (
    <div className="relative w-full overflow-hidden">
      <ModernHero />
      <ModernProducts />
      <ModernAi />
      <ModernServices />
      <ModernAbout />
    </div>
  )
}
