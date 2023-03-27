import { createTextNote, EventKind, signEvent } from "../src/event"
import { parsePublicKey } from "../src/crypto"
import assert from "assert"
import { setup } from "./setup"

describe("text note", () => {
  const note = "hello world"

  // Test that a text note can be published by one client and received by the other.
  it("publish and receive", (done) => {
    setup(
      done,
      ({
        publisher,
        publisherSecret,
        publisherPubkey,
        subscriber,
        timestamp,
        done,
      }) => {
        // Expect the test event.
        subscriber.on(
          "event",
          ({ event, subscriptionId: actualSubscriptionId }, nostr) => {
            assert.strictEqual(nostr, subscriber)
            assert.strictEqual(event.kind, EventKind.TextNote)
            assert.strictEqual(event.pubkey, parsePublicKey(publisherPubkey))
            assert.strictEqual(event.created_at, timestamp)
            assert.strictEqual(event.content, note)
            assert.strictEqual(actualSubscriptionId, subscriptionId)
            done()
          }
        )

        const subscriptionId = subscriber.subscribe([])

        // After the subscription event sync is done, publish the test event.
        subscriber.on("eose", (id, nostr) => {
          assert.strictEqual(nostr, subscriber)
          assert.strictEqual(id, subscriptionId)

          // TODO No signEvent, have a convenient way to do this
          signEvent(
            { ...createTextNote(note), created_at: timestamp },
            publisherSecret
          ).then((event) => publisher.publish(event))
        })
      }
    )
  })

  // Test that a client interprets an "OK" message after publishing a text note.
  it("publish and ok", function (done) {
    setup(done, ({ publisher, publisherSecret, url, done }) => {
      // TODO No signEvent, have a convenient way to do this
      signEvent(createTextNote(note), publisherSecret).then((event) => {
        publisher.on("ok", (params, nostr) => {
          assert.equal(nostr, publisher)
          assert.equal(params.eventId, event.id)
          assert.equal(params.relay.toString(), url.toString())
          assert.equal(params.ok, true)
          done()
        })

        publisher.publish(event)
      })
    })
  })
})
