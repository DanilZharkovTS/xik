'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'

import { dayOfMonth, formatDay, formatMonthShort } from '../report-dates'
import { niceScale } from '../chart-scale'
import { useElementWidth } from '../use-element-width'
import {
  EVENT_TYPE_COLORS,
  EVENT_LABEL_KEYS,
} from '../reports.types'
import type { EventType, Report, SeriesPoint } from '../reports.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const PLOT_HEIGHT = 200
const TOP_PAD = 8
const AXIS_HEIGHT = 28
const LEFT_PAD = 34
const RIGHT_PAD = 8
const MAX_BAR = 24
const SEGMENT_GAP = 2
const CORNER = 4
const MIN_LABEL_SPACING = 44

type ActivityChartProps = {
  report: Report
  types: EventType[]
}

const totalOf = (point: SeriesPoint, types: EventType[]): number =>
  types.reduce((sum, type) => sum + point[type], 0)

// Скруглення лише верхнього краю: низ стоїть рівно на базовій лінії.
const roundedTop = (x: number, y: number, width: number, height: number): string => {
  const r = Math.min(CORNER, width / 2, height)
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
}

const bucketLabel = (bucket: string, granularity: 'day' | 'month'): string =>
  granularity === 'month' ? formatMonthShort(bucket) : formatDay(bucket)

export function ActivityChart({ report, types }: ActivityChartProps): ReactElement {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(containerRef)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { series, range } = report
  const count = series.length
  const innerWidth = Math.max(0, width - LEFT_PAD - RIGHT_PAD)
  const slot = count > 0 ? innerWidth / count : 0
  const barWidth = Math.max(3, Math.min(MAX_BAR, slot - SEGMENT_GAP * 2))
  const max = Math.max(0, ...series.map((point) => totalOf(point, types)))
  const { top, ticks } = niceScale(max)
  const scale = (value: number) => (value / top) * PLOT_HEIGHT
  const baseline = TOP_PAD + PLOT_HEIGHT
  const labelStep = Math.max(1, Math.ceil(MIN_LABEL_SPACING / Math.max(slot, 1)))
  const hasData = max > 0

  const indexAt = (event: PointerEvent<SVGRectElement>): number => {
    const box = event.currentTarget.getBoundingClientRect()
    const relative = (event.clientX - box.left) / box.width
    return Math.min(count - 1, Math.max(0, Math.floor(relative * count)))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = activeIndex ?? -1

    if (event.key === 'ArrowRight') setActiveIndex(Math.min(count - 1, current + 1))
    else if (event.key === 'ArrowLeft') setActiveIndex(Math.max(0, current < 0 ? 0 : current - 1))
    else if (event.key === 'Home') setActiveIndex(0)
    else if (event.key === 'End') setActiveIndex(count - 1)
    else if (event.key === 'Escape') setActiveIndex(null)
    else return

    event.preventDefault()
  }

  const active = activeIndex === null ? null : series[activeIndex]
  const activeX = activeIndex === null ? 0 : LEFT_PAD + slot * activeIndex + slot / 2
  // Підказка не виходить за краї контейнера.
  const tooltipLeft = Math.min(Math.max(activeX, 70), Math.max(70, width - 70))

  return (
    <div>
      <div
        ref={containerRef}
        className="relative"
        tabIndex={0}
        role="group"
        aria-label={t('reports.chartLabel')}
        onKeyDown={onKeyDown}
        onBlur={() => setActiveIndex(null)}
      >
        {width > 0 && (
          <svg
            width={width}
            height={TOP_PAD + PLOT_HEIGHT + AXIS_HEIGHT}
            role="img"
            aria-hidden="true"
            className="block touch-pan-y select-none"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={LEFT_PAD}
                  x2={width - RIGHT_PAD}
                  y1={baseline - scale(tick)}
                  y2={baseline - scale(tick)}
                  stroke={tick === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'}
                  strokeWidth={1}
                />
                <text
                  x={LEFT_PAD - 6}
                  y={baseline - scale(tick) + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--viz-muted)"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            ))}

            {active && (
              <rect
                x={LEFT_PAD + slot * (activeIndex ?? 0)}
                y={TOP_PAD}
                width={slot}
                height={PLOT_HEIGHT}
                fill="var(--viz-grid)"
                opacity={0.6}
              />
            )}

            {series.map((point, index) => {
              const x = LEFT_PAD + slot * index + (slot - barWidth) / 2
              let used = 0
              const visible = types.filter((type) => point[type] > 0)

              return (
                <g key={point.bucket}>
                  {visible.map((type, position) => {
                    const height = scale(point[type])
                    const isTop = position === visible.length - 1
                    // Зазор кольору поверхні між сегментами, а не обводка.
                    const drawn = Math.max(1, height - (isTop ? 0 : SEGMENT_GAP))
                    const y = baseline - used - height
                    used += height

                    return (
                      <path
                        key={type}
                        d={
                          isTop
                            ? roundedTop(x, y, barWidth, drawn)
                            : `M${x},${y + height - drawn}h${barWidth}v${drawn}h${-barWidth}Z`
                        }
                        fill={EVENT_TYPE_COLORS[type]}
                      />
                    )
                  })}

                  {index % labelStep === 0 && (
                    <text
                      x={LEFT_PAD + slot * index + slot / 2}
                      y={baseline + 18}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--viz-muted)"
                    >
                      {range.granularity === 'month'
                        ? formatMonthShort(point.bucket)
                        : index === 0 || dayOfMonth(point.bucket) === '1'
                          ? formatDay(point.bucket)
                          : dayOfMonth(point.bucket)}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Зона наведення на всю висоту стовпця, більша за сам стовпець. */}
            {count > 0 && (
              <rect
                x={LEFT_PAD}
                y={TOP_PAD}
                width={innerWidth}
                height={PLOT_HEIGHT}
                fill="transparent"
                onPointerMove={(event) => setActiveIndex(indexAt(event))}
                onPointerDown={(event) => setActiveIndex(indexAt(event))}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') setActiveIndex(null)
                }}
              />
            )}

            {!hasData && (
              <text
                x={LEFT_PAD + innerWidth / 2}
                y={TOP_PAD + PLOT_HEIGHT / 2}
                textAnchor="middle"
                fontSize={14}
                fill="var(--viz-muted)"
              >
                {t('reports.noActivity')}
              </text>
            )}
          </svg>
        )}

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-[var(--viz-axis)] bg-[var(--viz-surface)] px-3 py-2 text-sm shadow-lg"
            style={{ left: tooltipLeft, top: 0 }}
          >
            <p className="mb-1 text-[var(--viz-text-2)]">
              {bucketLabel(active.bucket, range.granularity)}
            </p>
            {types.map((type) => (
              <p key={type} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-0.5 w-3"
                  style={{ background: EVENT_TYPE_COLORS[type] }}
                />
                <strong className="font-semibold text-[var(--viz-text)]">{active[type]}</strong>
                <span className="text-[var(--viz-text-2)]">{t(EVENT_LABEL_KEYS[type])}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm" aria-label={t('reports.legend')}>
        {types.map((type) => (
          <li key={type} className="flex items-center gap-2 text-[var(--viz-text-2)]">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: EVENT_TYPE_COLORS[type] }}
            />
            {t(EVENT_LABEL_KEYS[type])}
            <strong className="font-semibold text-[var(--viz-text)]">
              {report.totals[type].toLocaleString()}
            </strong>
          </li>
        ))}
      </ul>

      <details className="mt-3 text-sm">
        <summary className="min-h-11 cursor-pointer py-3 text-[var(--viz-text-2)]">
          {t('reports.showTable')}
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left">
            <caption className="sr-only">{t('reports.tableCaption')}</caption>
            <thead>
              <tr className="text-[var(--viz-muted)]">
                <th scope="col" className="py-1 pr-3 font-normal">
                  {range.granularity === 'month' ? t('reports.colMonth') : t('reports.colDay')}
                </th>
                {types.map((type) => (
                  <th key={type} scope="col" className="py-1 pr-3 text-right font-normal">
                    {t(EVENT_LABEL_KEYS[type])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[var(--viz-text)]">
              {series.map((point) => (
                <tr key={point.bucket} className="border-t border-[var(--viz-grid)]">
                  <th scope="row" className="py-1 pr-3 font-normal text-[var(--viz-text-2)]">
                    {bucketLabel(point.bucket, range.granularity)}
                  </th>
                  {types.map((type) => (
                    <td key={type} className="py-1 pr-3 text-right tabular-nums">
                      {point[type]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
