import Base from "events"
import { Nostr, SubscriptionId } from "."
import { Event, EventId } from "../event"

/**
 * Overrides providing better types for EventEmitter methods.
 */
export class EventEmitter extends Base {
  override addListener(eventName: "newListener", listener: NewListener): this
  override addListener(
    eventName: "removeListener",
    listener: RemoveListener
  ): this
  override addListener(eventName: "event", listener: EventListener): this
  override addListener(eventName: "notice", listener: NoticeListener): this
  override addListener(eventName: "ok", listener: OkListener): this
  override addListener(eventName: "eose", listener: EoseListener): this
  override addListener(eventName: "error", listener: ErrorListener): this
  override addListener(eventName: EventName, listener: Listener): this {
    return super.addListener(eventName, listener)
  }

  override emit(eventName: "newListener", listener: NewListener): boolean
  override emit(eventName: "removeListener", listener: RemoveListener): boolean
  override emit(eventName: "event", params: EventParams, nostr: Nostr): boolean
  override emit(eventName: "notice", notice: string, nostr: Nostr): boolean
  override emit(eventName: "ok", params: OkParams, nostr: Nostr): boolean
  override emit(
    eventName: "eose",
    subscriptionId: SubscriptionId,
    nostr: Nostr
  ): boolean
  override emit(eventName: "error", err: unknown, nostr: Nostr): boolean
  override emit(eventName: EventName, ...args: unknown[]): boolean {
    return super.emit(eventName, ...args)
  }

  override eventNames(): EventName[] {
    return super.eventNames() as EventName[]
  }

  override listeners(eventName: "newListener"): EventListener[]
  override listeners(eventName: "removeListener"): EventListener[]
  override listeners(eventName: "event"): EventListener[]
  override listeners(eventName: "notice"): NoticeListener[]
  override listeners(eventName: "ok"): OkListener[]
  override listeners(eventName: "eose"): EoseListener[]
  override listeners(eventName: "error"): ErrorListener[]
  override listeners(eventName: EventName): Listener[] {
    return super.listeners(eventName) as Listener[]
  }

  override off(eventName: "newListener", listener: NewListener): this
  override off(eventName: "removeListener", listener: RemoveListener): this
  override off(eventName: "event", listener: EventListener): this
  override off(eventName: "notice", listener: NoticeListener): this
  override off(eventName: "ok", listener: OkListener): this
  override off(eventName: "eose", listener: EoseListener): this
  override off(eventName: "error", listener: ErrorListener): this
  override off(eventName: EventName, listener: Listener): this {
    return super.off(eventName, listener)
  }

  override on(eventName: "newListener", listener: NewListener): this
  override on(eventName: "removeListener", listener: RemoveListener): this
  override on(eventName: "event", listener: EventListener): this
  override on(eventName: "notice", listener: NoticeListener): this
  override on(eventName: "ok", listener: OkListener): this
  override on(eventName: "eose", listener: EoseListener): this
  override on(eventName: "error", listener: ErrorListener): this
  override on(eventName: EventName, listener: Listener): this {
    return super.on(eventName, listener)
  }

  override once(eventName: "newListener", listener: NewListener): this
  override once(eventName: "removeListener", listener: RemoveListener): this
  override once(eventName: "event", listener: EventListener): this
  override once(eventName: "notice", listener: NoticeListener): this
  override once(eventName: "ok", listener: OkListener): this
  override once(eventName: "eose", listener: EoseListener): this
  override once(eventName: "error", listener: ErrorListener): this
  override once(eventName: EventName, listener: Listener): this {
    return super.once(eventName, listener)
  }

  override prependListener(
    eventName: "newListener",
    listener: NewListener
  ): this
  override prependListener(
    eventName: "removeListener",
    listener: RemoveListener
  ): this
  override prependListener(eventName: "event", listener: EventListener): this
  override prependListener(eventName: "notice", listener: NoticeListener): this
  override prependListener(eventName: "ok", listener: OkListener): this
  override prependListener(eventName: "eose", listener: EoseListener): this
  override prependListener(eventName: "error", listener: ErrorListener): this
  override prependListener(eventName: EventName, listener: Listener): this {
    return super.prependListener(eventName, listener)
  }

  override prependOnceListener(
    eventName: "newListener",
    listener: NewListener
  ): this
  override prependOnceListener(
    eventName: "removeListener",
    listener: RemoveListener
  ): this
  override prependOnceListener(
    eventName: "event",
    listener: EventListener
  ): this
  override prependOnceListener(
    eventName: "notice",
    listener: NoticeListener
  ): this
  override prependOnceListener(eventName: "ok", listener: OkListener): this
  override prependOnceListener(eventName: "eose", listener: EoseListener): this
  override prependOnceListener(
    eventName: "error",
    listener: ErrorListener
  ): this
  override prependOnceListener(eventName: EventName, listener: Listener): this {
    return super.prependOnceListener(eventName, listener)
  }

  override removeAllListeners(event?: EventName): this {
    return super.removeAllListeners(event)
  }

  override removeListener(eventName: "newListener", listener: NewListener): this
  override removeListener(
    eventName: "removeListener",
    listener: RemoveListener
  ): this
  override removeListener(eventName: "event", listener: EventListener): this
  override removeListener(eventName: "notice", listener: NoticeListener): this
  override removeListener(eventName: "ok", listener: OkListener): this
  override removeListener(eventName: "eose", listener: EoseListener): this
  override removeListener(eventName: "error", listener: ErrorListener): this
  override removeListener(eventName: EventName, listener: Listener): this {
    return super.removeListener(eventName, listener)
  }

  override rawListeners(eventName: EventName): Listener[] {
    return super.rawListeners(eventName) as Listener[]
  }

  // TODO
  // emitter[Symbol.for('nodejs.rejection')](err, eventName[, ...args]) shenanigans?
}

type EventName =
  | "newListener"
  | "removeListener"
  | "event"
  | "notice"
  | "ok"
  | "eose"
  | "error"

type NewListener = (eventName: EventName, listener: Listener) => void
type RemoveListener = (eventName: EventName, listener: Listener) => void
type EventListener = (params: EventParams, nostr: Nostr) => void
type NoticeListener = (notice: string, nostr: Nostr) => void
type OkListener = (params: OkParams, nostr: Nostr) => void
type EoseListener = (subscriptionId: SubscriptionId, nostr: Nostr) => void
type ErrorListener = (error: unknown, nostr: Nostr) => void

type Listener =
  | NewListener
  | RemoveListener
  | EventListener
  | NoticeListener
  | OkListener
  | EoseListener
  | ErrorListener

// TODO Document this
export interface EventParams {
  event: Event
  subscriptionId: SubscriptionId
}

// TODO Document this
export interface OkParams {
  eventId: EventId
  relay: URL
  ok: boolean
  message: string
}
