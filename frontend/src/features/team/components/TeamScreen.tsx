'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { teamService } from '../team.service'
import type { Moderator, TeamProduct } from '../team.types'
import { CreateModeratorSheet } from './CreateModeratorSheet'
import { ModeratorCard } from './ModeratorCard'
import { ProductsSheet } from './ProductsSheet'
import { ResetPasswordSheet } from './ResetPasswordSheet'
import { TransferTargetsSheet } from './TransferTargetsSheet'

interface TeamData {
  moderators: Moderator[]
  products: TeamProduct[]
}

const fetchTeam = async (token: string): Promise<TeamData> => {
  const [moderators, products] = await Promise.all([
    teamService.listModerators(token),
    teamService.listProducts(token),
  ])

  return { moderators, products }
}

export function TeamScreen(): ReactElement {
  const token = useAuthStore((state) => state.accessToken)

  const [moderators, setModerators] = useState<Moderator[]>([])
  const [products, setProducts] = useState<TeamProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [productsFor, setProductsFor] = useState<string | null>(null)
  const [passwordFor, setPasswordFor] = useState<string | null>(null)
  const [transferFor, setTransferFor] = useState<string | null>(null)

  const applyTeam = useCallback((team: TeamData) => {
    setModerators(team.moderators)
    setProducts(team.products)
    setIsLoading(false)
  }, [])

  // Оновлення після дії: помилка показується тостом, список лишається як був.
  const reload = useCallback(async () => {
    if (!token) return

    try {
      applyTeam(await fetchTeam(token))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [token, applyTeam])

  useEffect(() => {
    if (!token) return

    let isCancelled = false

    fetchTeam(token)
      .then((team) => {
        if (!isCancelled) applyTeam(team)
      })
      .catch((err: unknown) => {
        if (isCancelled) return
        toast.error(getErrorMessage(err))
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [token, applyTeam])

  const toggleActive = async (moderator: Moderator) => {
    if (!token) return

    const isActive = moderator.deactivatedAt === null

    if (
      isActive &&
      !window.confirm(
        `Deactivate ${moderator.name}? All their sessions will be signed out.`,
      )
    ) {
      return
    }

    try {
      setBusyId(moderator.id)

      if (isActive) {
        await teamService.deactivate(moderator.id, token)
      } else {
        await teamService.activate(moderator.id, token)
      }

      await reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const findModerator = (id: string | null): Moderator | null =>
    moderators.find((moderator) => moderator.id === id) ?? null

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 md:space-y-6 md:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium md:text-4xl">Team</h1>
          <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
            Moderators and the products they can work with.
          </p>
        </div>

        <div className="hidden md:block">
          <Button
            className="shrink-0"
            disabled={!token}
            onClick={() => setIsCreating(true)}
          >
            Add moderator
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">Loading...</p>
      ) : moderators.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">No moderators yet</p>
          <p className="mt-1 text-sm text-[var(--m)]">
            Add the first moderator and give them access to a product.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {moderators.map((moderator) => (
            <ModeratorCard
              key={moderator.id}
              moderator={moderator}
              isBusy={busyId === moderator.id}
              onProducts={() => setProductsFor(moderator.id)}
              onPassword={() => setPasswordFor(moderator.id)}
              onTransfer={() => setTransferFor(moderator.id)}
              onToggleActive={() => toggleActive(moderator)}
            />
          ))}
        </ul>
      )}

      {/* Головна дія на телефоні закріплена внизу, де її дістає великий палець. */}
      <div className="sticky bottom-0 -mx-4 border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <Button
          className="min-h-11 w-full"
          disabled={!token}
          onClick={() => setIsCreating(true)}
        >
          Add moderator
        </Button>
      </div>

      {token && (
        <>
          <CreateModeratorSheet
            isOpen={isCreating}
            token={token}
            onClose={() => setIsCreating(false)}
            onCreated={reload}
          />

          <ProductsSheet
            moderator={findModerator(productsFor)}
            products={products}
            token={token}
            onClose={() => setProductsFor(null)}
            onChanged={reload}
          />

          <TransferTargetsSheet
            source={findModerator(transferFor)}
            moderators={moderators}
            products={products}
            token={token}
            onClose={() => setTransferFor(null)}
            onDone={reload}
          />

          <ResetPasswordSheet
            moderator={findModerator(passwordFor)}
            token={token}
            onClose={() => setPasswordFor(null)}
          />
        </>
      )}
    </div>
  )
}
