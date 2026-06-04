import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  BatteryMedium,
  BellRing,
  Bus,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Footprints,
  Gift,
  Lock,
  LockOpen,
  MapPin,
  MessageSquare,
  PlayCircle,
  RefreshCcw,
  Sparkles,
  ThermometerSun,
  TicketPercent,
  Users,
  Wand2,
} from 'lucide-react'
import {
  buildLiveData,
  buildSuggestion,
  createInitialTimeline,
  fitScore,
  getItemWarnings,
  getQueueMin,
  isRainRisk,
  normalizeLiveContext,
  optimizeTimeline,
} from '../lib/liveOptimization'
import { getDestinationName, normalizeDestinationId } from '../lib/destinations'
import { loadLiveMoocClientData } from '../utils/liveMoocData'

const WEATHER_OPTIONS = ['sunny', 'cloudy', 'windy', 'light_rain', 'heavy_rain', 'very_hot', 'thunderstorm']
const CROWD_OPTIONS = ['low', 'medium', 'high', 'overcrowded']
const ENERGY_OPTIONS = ['high', 'medium', 'low']
const LOCATION_OPTIONS = [
  'resort_lobby',
  'hotel_lobby',
  'vinwonders_gate',
  'typhoon_world',
  'aquarium',
  'safari',
  'grand_world',
  'cable_car_station',
  'mainland_pier',
  'fairy_land',
  'kings_garden',
  'hon_tre_resort',
  'cam_ranh_airport',
]

const presetLabels = {
  normal_day: 'Normal',
  rainy_afternoon: 'Rainy',
  overcrowded: 'Crowded',
  family_fatigue: 'Fatigue',
  upsell: 'Upsell',
}

const weatherLabels = {
  sunny: 'Nắng',
  cloudy: 'Có mây',
  windy: 'Gió mạnh',
  light_rain: 'Mưa nhẹ',
  heavy_rain: 'Mưa lớn',
  very_hot: 'Rất nóng',
  thunderstorm: 'Dông',
}

const crowdLabels = {
  low: 'Thoáng',
  medium: 'Vừa',
  high: 'Đông',
  overcrowded: 'Quá tải',
}

const energyLabels = {
  high: 'Cao',
  medium: 'Vừa',
  low: 'Thấp',
}

const locationLabels = {
  resort_lobby: 'Resort lobby',
  hotel_lobby: 'Hotel lobby',
  vinwonders_gate: 'VinWonders gate',
  typhoon_world: 'Typhoon World',
  aquarium: 'Aquarium',
  safari: 'Safari',
  grand_world: 'Grand World',
  cable_car_station: 'Cable car station',
  mainland_pier: 'Mainland pier',
  fairy_land: 'Fairy Land',
  kings_garden: 'King’s Garden',
  hon_tre_resort: 'Hòn Tre resort',
  cam_ranh_airport: 'Cam Ranh airport',
}

export default function LiveScreen({ confirmedItinerary, destinationId = 'phu_quoc', setActiveTab }) {
  const normalizedDestinationId = normalizeDestinationId(destinationId)
  const localMoocData = useMemo(() => loadLiveMoocClientData(normalizedDestinationId), [normalizedDestinationId])
  const fallbackData = useMemo(
    () => buildLiveData(localMoocData),
    [localMoocData]
  )
  const liveDayOptions = useMemo(() => getLiveDayOptions(confirmedItinerary), [confirmedItinerary])
  const initialLiveDay = useMemo(() => getLiveDay(confirmedItinerary), [confirmedItinerary])
  const [selectedLiveDayNum, setSelectedLiveDayNum] = useState(() => initialLiveDay?.dayNum || 1)
  const fallbackTimeline = useMemo(
    () => itineraryToLiveTimeline(confirmedItinerary, fallbackData, selectedLiveDayNum) || createInitialTimeline(fallbackData),
    [confirmedItinerary, fallbackData, selectedLiveDayNum]
  )
  const liveDay = getLiveDay(confirmedItinerary, selectedLiveDayNum)
  const [data, setData] = useState(fallbackData)
  const [presets, setPresets] = useState(localMoocData.liveContext.presets)
  const [initialTimeline, setInitialTimeline] = useState(fallbackTimeline)
  const [selectedPreset, setSelectedPreset] = useState('normal_day')
  const [liveContext, setLiveContext] = useState(() => normalizeLiveContext(localMoocData.liveContext.presets.normal_day))
  const [timeline, setTimeline] = useState(fallbackTimeline)
  const [simulatedNowMinutes, setSimulatedNowMinutes] = useState(() => getDefaultNowMinutes(fallbackTimeline))
  const [itemLocks, setItemLocks] = useState({})
  const [toasts, setToasts] = useState([])
  const [reasons, setReasons] = useState([])
  const [serverSuggestion, setServerSuggestion] = useState('')
  const [warningsByItem, setWarningsByItem] = useState({})
  const [explanation, setExplanation] = useState('')
  const [aiProvider, setAiProvider] = useState('')
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const localSuggestion = useMemo(() => buildSuggestion(timeline, liveContext, data), [timeline, liveContext, data])
  const suggestion = serverSuggestion || localSuggestion
  const presetHint = presets[selectedPreset]?.recommendedReflex

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const localPresets = localMoocData.liveContext.presets
      const localPresetId = localPresets[selectedPreset] ? selectedPreset : Object.keys(localPresets)[0]
      const localTimeline = fallbackTimeline

      setData(fallbackData)
      setPresets(localPresets)
      setSelectedPreset(localPresetId)
      setInitialTimeline(localTimeline)
      setTimeline(localTimeline)
      setSimulatedNowMinutes(getDefaultNowMinutes(localTimeline))
      setLiveContext(normalizeLiveContext(localPresets[localPresetId]))
      setItemLocks({})
      setToasts([])
      setReasons([])
      setExplanation('')
      setServerSuggestion('')
      setAiProvider('')

      try {
        const payload = await apiGet(`/api/live/bootstrap?destinationId=${encodeURIComponent(normalizedDestinationId)}`)
        if (cancelled) return

        const remoteData = buildLiveData({
          destinationId: normalizedDestinationId,
          destinationName: getDestinationName(normalizedDestinationId),
          attractions: localMoocData.attractions,
          restaurants: payload.restaurants,
          transport: payload.transport,
          vouchers: payload.vouchers,
          itineraryTemplates: localMoocData.itineraryTemplates,
          latestQueues: payload.latestQueues,
        })

        setData(remoteData)
        setPresets(payload.presets)
        const remotePresetId = payload.presets[selectedPreset] ? selectedPreset : Object.keys(payload.presets)[0]
        const nextInitialTimeline = itineraryToLiveTimeline(confirmedItinerary, remoteData, selectedLiveDayNum) || payload.initialTimeline
        setInitialTimeline(nextInitialTimeline)
        setTimeline(nextInitialTimeline)
        setSimulatedNowMinutes(getDefaultNowMinutes(nextInitialTimeline))
        setSelectedPreset(remotePresetId)
        setLiveContext(normalizeLiveContext(payload.presets[remotePresetId]))
        setBackendAvailable(true)
      } catch {
        if (cancelled) return
        setBackendAvailable(false)
        setAiProvider('Local fallback')
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [confirmedItinerary, fallbackData, fallbackTimeline, localMoocData, normalizedDestinationId])

  useEffect(() => {
    const nextDay = getLiveDay(confirmedItinerary, selectedLiveDayNum)
    if (!nextDay && liveDayOptions.length) {
      setSelectedLiveDayNum(liveDayOptions[0].dayNum)
    }
  }, [confirmedItinerary, liveDayOptions, selectedLiveDayNum])

  useEffect(() => {
    if (!backendAvailable) {
      setWarningsByItem({})
      setServerSuggestion('')
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        // Deterministic + fast: live warnings/suggestion only. The provider
        // pill is driven by /optimize, so a control change never regresses it.
        const payload = await apiPost('/api/live/suggest', { destinationId: normalizedDestinationId, timeline, liveContext })
        if (cancelled) return
        setServerSuggestion(payload.suggestion)
        setWarningsByItem(payload.warningsByItem || {})
      } catch {
        if (cancelled) return
        setBackendAvailable(false)
        setServerSuggestion('')
        setWarningsByItem({})
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [timeline, liveContext, backendAvailable, normalizedDestinationId])

  const updateContext = (patch) => {
    setLiveContext((current) => ({ ...current, ...patch }))
    setToasts([])
    setReasons([])
    setExplanation('')
    setServerSuggestion('')
  }

  const selectPreset = (presetId) => {
    setSelectedPreset(presetId)
    setLiveContext(normalizeLiveContext(presets[presetId] || Object.values(presets)[0]))
    setTimeline(initialTimeline)
    setSimulatedNowMinutes(getDefaultNowMinutes(initialTimeline))
    setItemLocks({})
    setToasts([])
    setReasons([])
    setExplanation('')
    setServerSuggestion('')
  }

  const updateQueue = (id, value) => {
    updateContext({
      queues: {
        ...liveContext.queues,
        [id]: Number(value),
      },
    })
  }

  const toggleLock = (itemId) => {
    setItemLocks((current) => ({ ...current, [itemId]: !current[itemId] }))
  }

  const runLocalOptimize = () => {
    const result = optimizeTimeline(timeline, liveContext, itemLocks, data)
    setTimeline(result.timeline)
    setServerSuggestion('')
    setToasts(result.toasts)
    setReasons(result.reasons)
    setExplanation(result.suggestion)
    setAiProvider('')
  }

  const appendToast = (toast) => {
    if (!toast) return
    setToasts((current) => (current.includes(toast) ? current : [...current, toast]))
  }

  const handleAction = async (action, params = {}) => {
    if (!backendAvailable) {
      appendToast(localActionToast(action, params))
      return
    }

    setActionBusy(true)
    try {
      const payload = await apiPost('/api/live/action', { destinationId: normalizedDestinationId, action, params })
      appendToast(payload.toast)
    } catch {
      setBackendAvailable(false)
      appendToast(localActionToast(action, params))
    } finally {
      setActionBusy(false)
    }
  }

  const handleOptimize = async () => {
    if (!backendAvailable) {
      runLocalOptimize()
      return
    }

    setOptimizing(true)
    try {
      const payload = await apiPost('/api/live/optimize', { destinationId: normalizedDestinationId, timeline, liveContext, itemLocks })
      setTimeline(payload.timeline)
      setServerSuggestion(payload.suggestion)
      setToasts(payload.toasts || [])
      setReasons(payload.reasons || [])
      setExplanation(payload.explanation || '')
      setAiProvider(formatProvider(payload.provider))
    } catch {
      setBackendAvailable(false)
      runLocalOptimize()
    } finally {
      setOptimizing(false)
    }
  }

  const handleReset = () => {
    setTimeline(initialTimeline)
    setSimulatedNowMinutes(getDefaultNowMinutes(initialTimeline))
    setItemLocks({})
    setToasts([])
    setReasons([])
    setExplanation('')
    setServerSuggestion('')
  }

  const handleLiveDayChange = (dayNum) => {
    const nextDayNum = Number(dayNum)
    const nextTimeline = itineraryToLiveTimeline(confirmedItinerary, data, nextDayNum) || createInitialTimeline(data)
    setSelectedLiveDayNum(nextDayNum)
    setInitialTimeline(nextTimeline)
    setTimeline(nextTimeline)
    setSimulatedNowMinutes(getDefaultNowMinutes(nextTimeline))
    setItemLocks({})
    setToasts([])
    setReasons([])
    setExplanation('')
    setServerSuggestion('')
  }

  return (
    <>
      <div className="tab-view live-screen">
        <div className="live-hero">
          <div>
            <p className="live-kicker">Vinpearl Journey Concierge</p>
            <h2 className="live-title">Live Reflex</h2>
            <p className="live-subtitle">
              Ngày {liveDay?.dayNum || 1} · {getDestinationName(normalizedDestinationId)} · {confirmedItinerary?.title || 'Lịch trình demo'}
            </p>
          </div>
          <div className="live-hero-icon">
            <BellRing size={22} />
          </div>
        </div>

        <PhoneWidget
          timeline={timeline}
          nowMinutes={simulatedNowMinutes}
          liveContext={liveContext}
          itemLocks={itemLocks}
          suggestion={suggestion}
          toasts={toasts}
          reasons={reasons}
          explanation={explanation}
          warningsByItem={warningsByItem}
          aiProvider={aiProvider}
          backendAvailable={backendAvailable}
          optimizing={optimizing}
          actionBusy={actionBusy}
          data={data}
          onToggleLock={toggleLock}
          onOptimize={handleOptimize}
          onAction={handleAction}
          onReset={handleReset}
          setActiveTab={setActiveTab}
        />
      </div>

      {typeof document !== 'undefined' && createPortal(
        <aside className="live-demo-console" aria-label="Simulation controls for demo operator">
          <SimulationControlPanel
            liveContext={liveContext}
            selectedPreset={selectedPreset}
            presetHint={presetHint}
            presets={presets}
            data={data}
            liveDayOptions={liveDayOptions}
            selectedLiveDayNum={selectedLiveDayNum}
            timeline={timeline}
            nowMinutes={simulatedNowMinutes}
            onLiveDayChange={handleLiveDayChange}
            onPreset={selectPreset}
            onChange={updateContext}
            onQueueChange={updateQueue}
            onNowChange={setSimulatedNowMinutes}
          />
        </aside>,
        document.body
      )}
    </>
  )
}

function PhoneWidget({
  timeline,
  nowMinutes,
  liveContext,
  itemLocks,
  suggestion,
  toasts,
  reasons,
  explanation,
  warningsByItem,
  aiProvider,
  backendAvailable,
  optimizing,
  actionBusy,
  data,
  onToggleLock,
  onOptimize,
  onAction,
  onReset,
  setActiveTab,
}) {
  const activeVoucher = liveContext.voucherExpiring ? data.voucherById[liveContext.voucherExpiring] : null
  const providerLabel = providerPillLabel({ backendAvailable, optimizing, aiProvider })

  const currentIndex = findCurrentIndex(timeline, nowMinutes)
  const currentItem = currentIndex >= 0 ? timeline[currentIndex] : null
  const nextItem = timeline[currentIndex + 1] || null
  const nextTransport = nextItem ? pickTransport(currentItem, nextItem, liveContext, data) : null

  return (
    <section className="live-phone-widget">
      <div className="live-widget-top">
        <div>
          <p className="live-section-label">PhoneWidget</p>
          <h3 className="live-widget-title">Timeline hôm nay</h3>
        </div>
        <div className="live-widget-actions">
          <span className={`live-provider-pill ${backendAvailable ? 'online' : 'fallback'}`}>
            {providerLabel}
          </span>
          <button className="live-icon-btn" type="button" onClick={onReset} aria-label="Reset timeline">
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* NOW — chỉ rõ đang ở khung giờ nào và hoạt động hiện tại */}
      <div className="live-now-card">
        <div className="live-now-clock">
          <span className="live-now-pulse" />
          <strong>{formatMinutes(nowMinutes)}</strong>
          <span>Bây giờ</span>
        </div>
        <div className="live-now-body">
          {currentItem ? (
            <>
              <p className="live-now-status"><PlayCircle size={13} /> Đang diễn ra</p>
              <h4>{currentItem.title}</h4>
              <p className="live-now-zone"><MapPin size={12} /> {currentItem.zone}</p>
            </>
          ) : (
            <>
              <p className="live-now-status"><Clock size={13} /> Chuẩn bị khởi hành</p>
              <h4>{nextItem ? nextItem.title : 'Chưa có hoạt động'}</h4>
            </>
          )}
          {nextItem && (
            <p className="live-now-next">
              <ChevronRight size={13} /> Tiếp theo <strong>{nextItem.title}</strong> lúc {nextItem.time}
            </p>
          )}
        </div>
      </div>

      <div className="live-badges">
        <StatusBadge icon={CloudRain} label={weatherLabels[liveContext.weather] || liveContext.weather || 'Thời tiết'} alert={isRainRisk(liveContext)} />
        <StatusBadge icon={Users} label={crowdLabels[liveContext.crowd] || liveContext.crowd || 'Đám đông'} alert={['high', 'overcrowded'].includes(liveContext.crowd)} />
        <StatusBadge icon={BatteryMedium} label={energyLabels[liveContext.energy] || liveContext.energy || 'Năng lượng'} alert={liveContext.energy === 'low'} />
        {liveContext.childTired && <StatusBadge icon={AlertTriangle} label="Bé mệt" alert />}
        {liveContext.elderlyMode && <StatusBadge icon={Bus} label="Elderly" alert />}
        {activeVoucher && <StatusBadge icon={Gift} label="Voucher" alert />}
      </div>

      <div className="live-suggestion-box">
        <div className="live-suggestion-icon">
          <Sparkles size={16} />
        </div>
        <p>{suggestion}</p>
      </div>

      <div className="live-timeline">
        {timeline.map((item, index) => {
          const warningRecord = warningsByItem[item.id]
          const warnings = warningRecord?.warnings || getItemWarnings(item, liveContext)
          const queue = warningRecord?.queueMin ?? getQueueMin(item, liveContext)
          const score = warningRecord?.fitScore ?? fitScore(item, liveContext)
          const locked = Boolean(itemLocks[item.id])
          const status = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
          const nextStop = timeline[index + 1]
          const transit = nextStop ? pickTransport(item, nextStop, liveContext, data) : null

          return (
            <React.Fragment key={item.id}>
              <div
                className={`live-timeline-row status-${status} ${warnings.length ? 'has-warning' : ''} ${locked ? 'is-locked' : ''}`}
              >
                <div className="live-time">{item.time}</div>
                <div className="live-line-wrap">
                  <span className="live-node">
                    {status === 'done' && <Check size={9} strokeWidth={3.5} />}
                  </span>
                </div>
                <div className="live-card">
                  <div className="live-card-head">
                    <div>
                      {status === 'current' && <span className="live-now-chip"><PlayCircle size={11} /> Đang diễn ra</span>}
                      <h4>{item.title}</h4>
                      <p>{item.zone} · {item.type}</p>
                    </div>
                    <button
                      className={`live-lock-btn ${locked ? 'active' : ''}`}
                      type="button"
                      onClick={() => onToggleLock(item.id)}
                      aria-label={locked ? 'Unlock activity' : 'Lock activity'}
                    >
                      {locked ? <Lock size={14} /> : <LockOpen size={14} />}
                    </button>
                  </div>

                  <div className="live-card-meta">
                    {item.sourceType === 'attraction' && <span>Queue {queue}’</span>}
                    <span>Fit {Math.round(score * 100)}%</span>
                    {item.voucherTitle && <span className="live-voucher-pill"><TicketPercent size={12} /> F&B</span>}
                  </div>

                  {(warnings.length > 0 || item.voucherTitle) && (
                    <div className="live-card-badges">
                      {warnings.map((warning) => (
                        <span className={`live-warning-chip ${warning.tone}`} key={warning.key}>{warning.label}</span>
                      ))}
                      {item.voucherTitle && <span className="live-warning-chip success">{item.voucherTitle}</span>}
                    </div>
                  )}
                </div>
              </div>

              {transit && (
                <TransitSegment
                  transit={transit}
                  from={item}
                  to={nextStop}
                  active={index === currentIndex}
                  actionBusy={actionBusy}
                  onAction={onAction}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {reasons.length > 0 && (
        <div className="live-reasons">
          {explanation && <p><Sparkles size={13} /> {explanation}</p>}
          {reasons.slice(0, 3).map((reason) => (
            <p key={reason}><CheckCircle2 size={13} /> {reason}</p>
          ))}
        </div>
      )}

      {toasts.length > 0 && (
        <div className="live-toast-list">
          {toasts.map((toast) => (
            <div className="live-toast" key={toast}>{toast}</div>
          ))}
        </div>
      )}



      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="live-optimize-btn" style={{ flex: 1, margin: 0 }} type="button" onClick={onOptimize} disabled={optimizing}>
          <Wand2 size={16} /> {optimizing ? 'Optimizing...' : 'Optimize'}
        </button>
        <button 
          style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', flexShrink: 0 }} 
          type="button" 
          onClick={() => setActiveTab && setActiveTab('chat')} 
          title="Tùy chỉnh lịch trình với AI"
        >
          <MessageSquare size={18} />
        </button>
      </div>
    </section>
  )
}

function TransitSegment({ transit, from, to, active, actionBusy, onAction }) {
  const Icon = transit.bookable
    ? (/shuttle|van|bus/i.test(transit.mode) ? Bus : Car)
    : Footprints
  const route = `${shortZone(from?.zone)} → ${shortZone(to?.zone)}`

  return (
    <div className={`live-transit ${active ? 'active' : ''}`}>
      <div className="live-transit-spacer" />
      <div className="live-transit-rail">
        <span className="live-transit-icon"><Icon size={13} /></span>
      </div>
      <div className="live-transit-card">
        <div className="live-transit-info">
          <strong>{transit.mode}</strong>
          <span>{route} · {transit.etaMin}′ · {formatVnd(transit.price)}</span>
          {transit.note && <em>{transit.note}</em>}
        </div>
        {transit.bookable ? (
          <button
            className="live-transit-btn"
            type="button"
            disabled={actionBusy}
            onClick={() => onAction('call_green_sm', { transportId: transit.vehicleId, mode: transit.mode, etaMin: transit.etaMin })}
          >
            <Car size={13} /> {actionBusy ? 'Đang gọi…' : 'Gọi xe'}
          </button>
        ) : (
          <span className="live-transit-walk"><Footprints size={13} /> Đi bộ</span>
        )}
      </div>
    </div>
  )
}

function providerPillLabel({ backendAvailable, optimizing, aiProvider }) {
  if (!backendAvailable) return 'Offline · local'
  if (optimizing) return 'AI · đang xử lý…'
  if (aiProvider) return `AI · ${aiProvider}`
  return 'AI · sẵn sàng'
}

function SimulationControlPanel({
  liveContext,
  selectedPreset,
  presetHint,
  presets,
  data,
  liveDayOptions,
  selectedLiveDayNum,
  timeline,
  nowMinutes,
  onLiveDayChange,
  onPreset,
  onChange,
  onQueueChange,
  onNowChange,
}) {
  const presetIds = useMemo(() => {
    const ids = Object.keys(presets || {})
    return ids.length ? ids : ['normal_day']
  }, [presets])
  const queueControls = useMemo(() => {
    const controls = (data?.attractions || [])
      .filter((item) => item.defaultQueueMin != null || data.latestQueues?.[item.id] != null)
      .slice(0, 5)
      .map((item) => ({ id: item.id, label: item.name }))
    return controls.length ? controls : (data?.attractions || []).slice(0, 5).map((item) => ({ id: item.id, label: item.name }))
  }, [data])
  const voucherOptions = data?.vouchers || []

  return (
    <section className="live-control-panel">
      <div className="live-control-header">
        <div>
          <p className="live-section-label">Bảng điều khiển demo</p>
          <h3 className="live-control-title">Mô phỏng tình huống</h3>
        </div>
        <span className="live-control-tag">Live</span>
      </div>
      <p className="live-control-caption">
        Chỉnh các điều kiện thực tế bên dưới, rồi bấm <strong>Optimize</strong> trên điện thoại để xem AI phản ứng.
      </p>

      <ControlSection step={1} title="Kịch bản mẫu" hint="Chọn nhanh một tình huống có sẵn">
        <div className="live-preset-grid">
          {presetIds.map((presetId) => (
            <button
              key={presetId}
              type="button"
              className={`live-preset-btn ${selectedPreset === presetId ? 'active' : ''}`}
              onClick={() => onPreset(presetId)}
            >
              {presetLabels[presetId] || formatPresetLabel(presetId)}
            </button>
          ))}
        </div>
        {presetHint && (
          <p className="live-preset-hint"><Sparkles size={12} /> {presetHint}</p>
        )}
      </ControlSection>

      <ControlSection step={2} title="Ngày & thời gian" hint="Chọn ngày rồi tua mốc Bây giờ">
        <DayControl
          days={liveDayOptions}
          selectedDayNum={selectedLiveDayNum}
          onChange={onLiveDayChange}
        />
        <TimeOfDayControl
          timeline={timeline}
          nowMinutes={nowMinutes}
          onChange={onNowChange}
        />
      </ControlSection>

      <ControlSection step={3} title="Thời tiết & đám đông" hint="Tác động tới hoạt động ngoài trời">
        <div className="live-control-grid">
          <SelectControl
            label="Thời tiết"
            value={liveContext.weather}
            options={WEATHER_OPTIONS}
            labels={weatherLabels}
            icon={CloudRain}
            onChange={(value) => onChange({ weather: value })}
          />
          <SelectControl
            label="Đám đông"
            value={liveContext.crowd}
            options={CROWD_OPTIONS}
            labels={crowdLabels}
            icon={Users}
            onChange={(value) => onChange({ crowd: value })}
          />
        </div>
        <label className="live-slider">
          <span><ThermometerSun size={14} /> Khả năng mưa</span>
          <strong>{liveContext.rainProb}%</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={liveContext.rainProb}
            onChange={(event) => onChange({ rainProb: Number(event.target.value) })}
          />
        </label>
      </ControlSection>

      <ControlSection step={4} title="Trạng thái gia đình" hint="Quyết định nhịp đi chơi và nghỉ ngơi">
        <div className="live-field">
          <p className="live-field-label">Năng lượng cả nhà</p>
          <div className="live-energy-row">
            {ENERGY_OPTIONS.map((energy) => (
              <button
                type="button"
                key={energy}
                className={`live-segment ${liveContext.energy === energy ? 'active' : ''}`}
                onClick={() => onChange({ energy })}
              >
                {energyLabels[energy]}
              </button>
            ))}
          </div>
        </div>
        <div className="live-toggle-grid">
          <ToggleControl label="Bé mệt" checked={liveContext.childTired} onChange={(value) => onChange({ childTired: value })} />
          <ToggleControl label="Có người lớn tuổi" checked={liveContext.elderlyMode} onChange={(value) => onChange({ elderlyMode: value, avoidLongWalk: value || liveContext.avoidLongWalk })} />
          <ToggleControl label="Hạn chế đi bộ" checked={liveContext.avoidLongWalk} onChange={(value) => onChange({ avoidLongWalk: value })} />
          <ToggleControl label="Bữa tối gấp" checked={liveContext.dinnerSlotTight} onChange={(value) => onChange({ dinnerSlotTight: value })} />
        </div>
      </ControlSection>

      <ControlSection step={5} title="Vị trí & hàng chờ" hint="Số phút chờ hiện tại ở từng điểm">
        <SelectControl
          label="Đang ở"
          value={liveContext.location}
          options={LOCATION_OPTIONS}
          labels={locationLabels}
          icon={MapPin}
          onChange={(value) => onChange({ location: value })}
        />
        <div className="live-queue-panel">
          <p className="live-mini-title">Thời gian chờ (phút)</p>
          {queueControls.map((control) => (
            <label className="live-queue-row" key={control.id}>
              <span>{control.label}</span>
              <input
                type="number"
                min="0"
                max="120"
                value={liveContext.queues?.[control.id] ?? 0}
                onChange={(event) => onQueueChange(control.id, event.target.value)}
              />
            </label>
          ))}
        </div>
      </ControlSection>

      <ControlSection step={6} title="Ưu đãi" hint="Voucher cần dùng trước khi hết hạn">
        <label className="live-voucher-select">
          <span><Gift size={14} /> Voucher sắp hết hạn</span>
          <select
            value={liveContext.voucherExpiring || ''}
            onChange={(event) => onChange({ voucherExpiring: event.target.value })}
          >
            <option value="">Không dùng</option>
            {voucherOptions.map((voucher) => (
              <option value={voucher.id} key={voucher.id}>{voucher.title}</option>
            ))}
          </select>
        </label>
      </ControlSection>
    </section>
  )
}

function DayControl({ days, selectedDayNum, onChange }) {
  if (!days?.length) return null

  return (
    <label className="live-day-select">
      <span><CalendarDays size={14} /> Ngày demo</span>
      <select
        aria-label="Ngày demo"
        value={selectedDayNum}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {days.map((day) => (
          <option value={day.dayNum} key={day.dayNum}>
            Ngày {day.dayNum} · {day.eventCount} hoạt động
          </option>
        ))}
      </select>
    </label>
  )
}

function TimeOfDayControl({ timeline, nowMinutes, onChange }) {
  const bounds = useMemo(() => getTimelineTimeBounds(timeline), [timeline])
  const currentMinutes = clampMinutes(nowMinutes ?? bounds.min, bounds.min, bounds.max)
  const currentItem = timeline[findCurrentIndex(timeline, currentMinutes)]
  const nextItem = timeline.find((item) => timeToMinutes(item.time) > currentMinutes)

  return (
    <div className="live-time-control">
      <div className="live-time-control-top">
        <label className="live-time-input">
          <span><Clock size={14} /> Giờ demo</span>
          <input
            type="time"
            aria-label="Giờ demo"
            value={formatMinutes(currentMinutes)}
            onChange={(event) => onChange(timeToMinutes(event.target.value))}
          />
        </label>
        <div className="live-time-readout">
          <strong>{formatMinutes(currentMinutes)}</strong>
          <span>Bây giờ</span>
        </div>
      </div>
      <input
        className="live-time-range"
        type="range"
        aria-label="Tua thời gian trong ngày"
        min={bounds.min}
        max={bounds.max}
        step="5"
        value={currentMinutes}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="live-time-range-labels">
        <span>{formatMinutes(bounds.min)}</span>
        <span>{formatMinutes(bounds.max)}</span>
      </div>
      <div className="live-time-current">
        <p>Đang neo</p>
        <strong>{currentItem?.title || nextItem?.title || 'Chưa có hoạt động'}</strong>
      </div>
    </div>
  )
}

function ControlSection({ step, title, hint, children }) {
  return (
    <div className="live-group">
      <div className="live-group-head">
        <span className="live-group-step">{step}</span>
        <div>
          <p className="live-group-name">{title}</p>
          {hint && <p className="live-group-hint">{hint}</p>}
        </div>
      </div>
      <div className="live-group-body">{children}</div>
    </div>
  )
}

function formatPresetLabel(presetId) {
  return String(presetId || '')
    .split('_')
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StatusBadge({ icon: Icon, label, alert }) {
  return (
    <span className={`live-status-badge ${alert ? 'alert' : ''}`}>
      <Icon size={13} /> {label}
    </span>
  )
}

function SelectControl({ label, value, options, labels, icon: Icon, onChange }) {
  return (
    <label className="live-select">
      <span><Icon size={14} /> {label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option} key={option}>{labels[option] || option}</option>
        ))}
      </select>
    </label>
  )
}

function ToggleControl({ label, checked, onChange }) {
  return (
    <button
      type="button"
      className={`live-toggle ${checked ? 'active' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className="live-switch" />
    </button>
  )
}

function getLiveDayOptions(itinerary) {
  return (itinerary?.days || [])
    .filter((day) => day?.events?.length)
    .map((day) => ({
      dayNum: day.dayNum,
      eventCount: day.events.length,
    }))
}

function getLiveDay(itinerary, selectedDayNum = null) {
  if (!itinerary?.days?.length) return null
  if (selectedDayNum) {
    const selectedDay = itinerary.days.find((day) => day.dayNum === selectedDayNum)
    if (selectedDay?.events?.length) return selectedDay
  }
  const explicitDayNum = itinerary.liveDayNum || itinerary.activeDayNum || itinerary.currentDayNum
  return itinerary.days.find((day) => day.dayNum === explicitDayNum)
    || itinerary.days.find((day) => day.isLive || day.isCurrent)
    || itinerary.days.find((day) => day.events?.length)
    || itinerary.days[0]
}

function itineraryToLiveTimeline(itinerary, data, selectedDayNum = null) {
  const liveDay = getLiveDay(itinerary, selectedDayNum)
  const events = liveDay?.events || []
  if (!events.length) return null

  return events
    .map((event, index) => eventToLiveItem(event, index, data))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
}

function eventToLiveItem(event, index, data) {
  const matched = findLiveEntity(event, data)
  const time = event.time || '09:00'

  if (matched?.kind === 'attraction') {
    const attraction = matched.entity
    return {
      id: `${attraction.id}_${index}_${time.replace(':', '')}`,
      sourceId: attraction.id,
      time,
      title: event.title || attraction.name,
      zone: attraction.zone,
      type: attraction.type,
      sourceType: 'attraction',
      indoor: attraction.indoor,
      outdoor: !attraction.indoor,
      weatherSensitive: Boolean(attraction.weatherSensitive),
      intensity: attraction.intensity || 'low',
      walkLevel: attraction.walkLevel || 'low',
      defaultQueueMin: data.latestQueues?.[attraction.id] ?? attraction.defaultQueueMin ?? 0,
      kidFriendly: attraction.kidFriendly,
      elderlyFriendly: attraction.elderlyFriendly,
      reason: event.desc || 'Lấy từ lịch trình đã chốt.',
    }
  }

  if (matched?.kind === 'restaurant') {
    const restaurant = matched.entity
    return {
      id: `${restaurant.id}_${index}_${time.replace(':', '')}`,
      sourceId: restaurant.id,
      time,
      title: event.title || restaurant.name,
      zone: restaurant.zone || restaurant.park || 'Vinpearl',
      type: 'meal',
      sourceType: 'restaurant',
      indoor: restaurant.indoor,
      outdoor: !restaurant.indoor,
      weatherSensitive: false,
      intensity: 'low',
      walkLevel: 'low',
      defaultQueueMin: 0,
      kidFriendly: restaurant.kidFriendly ?? true,
      elderlyFriendly: restaurant.elderlyFriendly ?? true,
      acceptsVoucher: restaurant.acceptsVoucher || [],
      mealPeriod: inferMealPeriod(time),
      reason: event.desc || 'Lấy từ lịch trình đã chốt.',
    }
  }

  return {
    id: `custom_${index}_${time.replace(':', '')}`,
    sourceId: `custom_${index}`,
    time,
    title: event.title || 'Hoạt động trong lịch trình',
    zone: 'Lịch đã chốt',
    type: inferActivityType(event),
    sourceType: 'custom',
    indoor: false,
    outdoor: true,
    weatherSensitive: isLikelyOutdoor(event),
    intensity: 'low',
    walkLevel: 'low',
    defaultQueueMin: 0,
    kidFriendly: true,
    elderlyFriendly: true,
    reason: event.desc || 'Hoạt động do người dùng chốt.',
  }
}

function findLiveEntity(event, data) {
  const text = normalizeText(`${event.title || ''} ${event.desc || ''}`)
  const attraction = findBestEntityMatch(text, data.attractions)
  if (attraction) return { kind: 'attraction', entity: attraction }

  const restaurant = findBestEntityMatch(text, data.restaurants)
  if (restaurant) return { kind: 'restaurant', entity: restaurant }

  return null
}

const ENTITY_STOP_WORDS = new Set([
  'vinpearl',
  'vinwonders',
  'phu',
  'quoc',
  'nha',
  'trang',
  'nam',
  'hoi',
  'long',
  'world',
  'show',
  'park',
  'restaurant',
  'resort',
  'indoor',
  'outdoor',
  'the',
  'and',
  'viet',
])

const DISTINCTIVE_ENTITY_TOKENS = new Set([
  'akoya',
  'alpine',
  'aquarium',
  'bamboo',
  'beach',
  'bird',
  'buffet',
  'cable',
  'coaster',
  'giraffe',
  'kayak',
  'mermaid',
  'roller',
  'safari',
  'sea',
  'shell',
  'spa',
  'tata',
  'teddy',
  'typhoon',
  'venice',
  'viking',
  'water',
  'zipline',
])

function findBestEntityMatch(text, entities = []) {
  let best = null

  entities.forEach((entity) => {
    const score = entityMatchScore(text, entity)
    if (score >= 3 && (!best || score > best.score)) {
      best = { entity, score }
    }
  })

  return best?.entity || null
}

function entityMatchScore(text, entity) {
  const exactAliases = [entity.name].map(normalizeText).filter(Boolean)
  const exactAlias = exactAliases.find((alias) => alias.length >= 8 && text.includes(alias))
  if (exactAlias) return 10 + exactAlias.split(' ').length

  const aliases = [
    entity.name,
    entity.zone,
    ...(entity.tags || []),
  ].map(normalizeText).filter(Boolean)
  const tokens = [...new Set(
    aliases.flatMap((alias) => alias.split(' '))
      .filter((token) => token.length >= 3 && !ENTITY_STOP_WORDS.has(token))
  )]
  const hits = tokens.filter((token) => text.includes(token))
  let score = hits.length

  const park = normalizeText(entity.park || '')
  const type = normalizeText(entity.type || '')
  const zone = normalizeText(entity.zone || '')

  if (text.includes('grand world') && (park.includes('grandworld') || zone.includes('grand world'))) score += 2
  if (text.includes('safari') && (park.includes('safari') || type.includes('safari'))) score += 2
  if ((text.includes('show') || text.includes('dien')) && type.includes('show')) score += 2
  const looksLikeRestaurant = Array.isArray(entity.cuisine) || Array.isArray(entity.slots) || entity.pricePerPax != null
  if ((text.includes('an') || text.includes('buffet') || text.includes('nha hang')) && looksLikeRestaurant) score += 2

  if (hits.some((token) => DISTINCTIVE_ENTITY_TOKENS.has(token))) score += 1
  if (score < 3 && hits.length < 2 && !hits.some((token) => DISTINCTIVE_ENTITY_TOKENS.has(token))) return 0

  return score
}

function normalizeText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

function inferMealPeriod(time) {
  const minutes = timeToMinutes(time)
  if (minutes >= 17 * 60) return 'dinner'
  if (minutes >= 10 * 60) return 'lunch'
  return null
}

function inferActivityType(event) {
  const text = normalizeText(`${event.title || ''} ${event.desc || ''}`)
  if (text.includes('an ') || text.includes('buffet') || text.includes('nha hang')) return 'meal'
  if (text.includes('spa') || text.includes('nghi')) return 'rest'
  if (text.includes('check-in') || text.includes('check out') || text.includes('check-out')) return 'service'
  return 'activity'
}

function isLikelyOutdoor(event) {
  const text = normalizeText(`${event.title || ''} ${event.desc || ''}`)
  return ['bien', 'safari', 'cong vien', 'vinwonders', 'grand world', 'kayak', 'ho boi'].some((keyword) => text.includes(keyword))
}

function timeToMinutes(time = '00:00') {
  const [hours = '0', minutes = '0'] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

function getDefaultNowMinutes(timeline = []) {
  if (!timeline.length) return 9 * 60
  const starts = timeline.map((item) => timeToMinutes(item.time))
  const first = starts[0]
  const last = starts[starts.length - 1]
  const now = new Date()
  const real = now.getHours() * 60 + now.getMinutes()
  if (real >= first - 20 && real <= last + 90) return real
  const anchorIdx = Math.min(1, timeline.length - 1)
  return starts[anchorIdx] + 7
}

function getTimelineTimeBounds(timeline = []) {
  if (!timeline.length) return { min: 8 * 60, max: 20 * 60 }
  const starts = timeline.map((item) => timeToMinutes(item.time))
  const min = Math.max(0, Math.min(...starts) - 30)
  const max = Math.min(23 * 60 + 59, Math.max(...starts) + 90)
  return { min, max }
}

function clampMinutes(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min))
}

function findCurrentIndex(timeline, nowMinutes) {
  let index = -1
  timeline.forEach((item, i) => {
    if (timeToMinutes(item.time) <= nowMinutes) index = i
  })
  return index
}

// Gợi ý phương tiện di chuyển giữa hai điểm theo bối cảnh thực tế.
function pickTransport(from, to, ctx, data) {
  const vehicles = data?.transport || []
  const fromZone = normalizeText(from?.zone || 'resort')
  const toZone = normalizeText(to?.zone || '')
  const sameZone = Boolean(fromZone) && fromZone === toZone
  const elderly = Boolean(ctx?.elderlyMode || ctx?.avoidLongWalk)
  const rainy = isRainRisk(ctx)

  const make = (vehicle, note, fallbackMode) => ({
    mode: vehicle?.type || fallbackMode || 'Green SM xe điện',
    etaMin: vehicle?.etaMin ?? 8,
    price: vehicle?.pricePerTrip ?? 0,
    bookable: true,
    vehicleId: vehicle?.id || null,
    note,
  })
  const vehicleByType = (pattern) => vehicles.find((vehicle) => pattern.test(`${vehicle.type || ''} ${vehicle.id || ''}`))
  const coveredVehicle = vehicles.find((vehicle) => vehicle.acAndStepFree || vehicle.elderlyFriendly)
    || vehicleByType(/green|car|taxi|xe|boat|shuttle/i)
    || vehicles[0]
  const buggy = vehicleByType(/buggy|cart|xe dien|electric/i) || coveredVehicle
  const shuttle = vehicleByType(/shuttle|bus|van|boat|transfer/i) || coveredVehicle

  if (sameZone && !elderly && !rainy) {
    return { mode: 'Đi bộ', etaMin: 5, price: 0, bookable: false, vehicleId: null, note: 'Cùng khu vực, đi bộ ~5 phút' }
  }
  if (rainy) {
    return make(coveredVehicle, 'Có mái che, tránh mưa', 'Xe nội khu')
  }
  if (elderly) {
    return make(sameZone ? buggy : coveredVehicle, 'Ưu tiên xe êm, lên xuống dễ', 'Xe hỗ trợ')
  }
  if (sameZone) {
    return make(buggy, 'Buggy nội khu di chuyển nhanh', 'Buggy nội khu')
  }
  return make(shuttle, 'Tuyến shuttle nối khu', 'Resort Shuttle')
}

function formatMinutes(total) {
  const value = Math.max(0, Math.round(total))
  const hours = Math.floor(value / 60) % 24
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatVnd(value) {
  if (!value) return 'Miễn phí'
  return `${Math.round(value / 1000)}k đ`
}

function shortZone(zone) {
  if (!zone) return 'Vinpearl'
  return zone.length > 16 ? `${zone.slice(0, 15)}…` : zone
}

async function apiGet(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`)
  return response.json()
}

async function apiPost(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`POST ${url} failed: ${response.status}`)
  return response.json()
}

function formatProvider(provider) {
  if (provider === 'mimo') return 'MIMO'
  if (provider === 'openai') return 'OpenAI'
  if (provider === 'openrouter') return 'OpenRouter'
  return 'Fallback'
}

function localActionToast(action, params = {}) {
  if (action === 'call_green_sm') {
    const mode = params.mode || 'Green SM xe điện 7 chỗ'
    const eta = params.etaMin ? `, ETA ${params.etaMin} phút` : ''
    return `✓ Đã gọi ${mode}${eta}, xe đang đến điểm đón (demo offline)`
  }
  return '✓ Đã ghi nhận yêu cầu (demo offline)'
}
