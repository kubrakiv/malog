# Tenders Real-Time Update Guide

This document explains how real-time tender updates work for the `/tenders` page.

It is written as a universal flow description, not as a description of one specific code implementation.

Goal:
- explain what is subscribed first
- explain which tender events exist
- explain how each event should be matched to a tender in the list
- explain how the list should react to each event
- explain which updates should be immediate and which should trigger a refresh flow

## 1. Main idea

Real-time tender updates work in 2 layers:

1. A global real-time connection for the authenticated user
2. A tenders-page listener that reacts to tender-related events and updates the currently visible list

Important:
- the page itself does not need to create a separate real-time connection every time it opens
- instead, it should use the already authenticated real-time session
- the tenders page only needs to attach and remove event handlers for tender events

## 2. What should happen first

Before the tenders page receives real-time updates:

1. the user must be authenticated
2. the real-time client must be initialized
3. the client must subscribe to the current user's private event stream
4. the tenders page must attach handlers for tender events

So the order is:

1. authenticate user
2. open real-time client
3. subscribe to the user's private channel
4. listen for tender events
5. update the visible tender list when events arrive

## 3. Channel concept

Tender real-time events come through a private user-scoped channel.

That channel represents:

- one authenticated user
- all tender events relevant to that user

Typical flow:

1. take the current user id
2. build a private channel identifier for that user
3. subscribe to that private user channel

This keeps the subscription model simple:

- one user channel
- many tender-related events inside it

## 4. Event types

The tenders page reacts to these event types:

- `tenderCreated`
- `bid`
- `ended`
- `winnerChoosen`
- `deleted`
- `revived`
- `updated`

These events have different purposes:

- `tenderCreated`
  - tells the page that a new tender exists

- `bid`
  - tells the page that the bidding state changed

- `ended`
  - tells the page that a tender has finished

- `winnerChoosen`
  - tells the page that winner selection is finalized

- `deleted`
  - tells the page that a tender is no longer active because it was deleted

- `revived`
  - tells the page that a previously deleted or ended tender became active again

- `updated`
  - tells the page that tender content changed

## 5. Matching rules

To apply real-time events to the correct card, the tenders list uses stable matching keys.

There are usually 2 useful identifiers:

- a secure tender identifier for real-time events
- a human-visible tender number for list ordering and normal fetch flows

Universal rule:

- use the secure tender id for real-time state events
- use the tender number or periodic number for list refresh and content grouping

### Use secure tender id for:

- `bid`
- `ended`
- `winnerChoosen`
- `deleted`
- `revived`

### Use tender number / periodic for:

- `updated`
- list ordering
- standard fetch-based reloads

## 6. Two kinds of real-time reactions

Tender real-time events fall into 2 groups.

### Group A. Immediate card mutation

These events patch the currently visible card immediately:

- `bid`
- `ended`
- `winnerChoosen`
- `deleted`
- `revived`
- `updated`

### Group B. Deferred refresh signal

This event does not insert a full card immediately:

- `tenderCreated`

Instead, it:

1. mark that new tenders are available
2. show a refresh signal in the UI
3. rerun the normal tenders fetch pipeline when the user refreshes or when the page decides to reload

## 7. `tenderCreated` behavior

Purpose:
- notify the page that new tenders exist

This event alone does not build a complete new tender card.

Flow:

1. receive `tenderCreated`
2. store the event in temporary page or global state
3. show "new tenders available"
4. on refresh action, rerun the normal tenders list fetch sequence
5. rebuild tabs, filters, pagination, and visible cards from backend data

This makes the real-time layer act as:

- a refresh trigger

instead of:

- the only source of full tender card data

## 8. `bid` behavior

Purpose:
- update the current bidding state of a visible tender

When a `bid` event arrives:

1. find the visible tender card by secure tender id
2. update the current best bid information
3. update whether the current best bid belongs to the current user
4. update bid count or bid-related list state if the UI shows it
5. if the event includes a changed tender deadline, update that too

The card immediately reflects:

- new best price
- whether I am winning or losing
- updated bid count
- updated countdown target if deadline changed

## 9. `ended` behavior

Purpose:
- mark the tender as finished

When an `ended` event arrives:

1. find the visible tender card by secure tender id
2. mark the card as ended
3. disable interactions that are only valid while the tender is active

The card immediately reflects:

- no more active bidding
- finished/disabled state

## 10. `winnerChoosen` behavior

Purpose:
- mark that winner selection has been completed

For the tenders list page, this event is treated as a state-finalization event.

When it arrives:

1. find the visible tender card by secure tender id
2. mark the card as no longer active
3. update winner-related state when that information is part of the list state

The list reflects:

- tender is no longer active

## 11. `deleted` behavior

Purpose:
- mark that the tender was deleted

When a `deleted` event arrives:

1. find the visible tender card by secure tender id
2. mark the card as deleted
3. disable normal actions for that card

The card stays visible but switches into a deleted/disabled state.

## 12. `revived` behavior

Purpose:
- restore a previously ended or deleted tender

When a `revived` event arrives:

1. find the visible tender card by secure tender id
2. clear deleted state
3. clear ended state
4. restore the card to active behavior

The card becomes interactive again if it still belongs in the current list context.

## 13. `updated` behavior

Purpose:
- patch tender content fields when tender conditions change

This event is different from bid-state events.
It is mainly about card content.

When it arrives:

1. find the visible tender by tender number / periodic identifier
2. patch the fields that describe the tender

Typical fields updated by this event:

- vehicle requirements
- cargo text
- loading/unloading labels
- tender deadline
- pricing mode
- offer quantity
- checkpoint summary

The goal is:

- keep the visible card content current without reloading the full list

## 14. Page state needed for real-time updates

To support real-time tender updates, the tenders page keeps:

- visible tender cards
- secure tender id for each visible card
- tender number / periodic for each visible card
- temporary state for newly announced tenders
- optionally, bid-notification counters

This allows the page to:

- patch existing cards immediately
- know when it must trigger a full list reload

## 15. List reaction model

The tenders page should react to real-time updates in this way:

### Immediate patch events

- `bid`
- `ended`
- `winnerChoosen`
- `deleted`
- `revived`
- `updated`

Behavior:
- update the matching visible card directly

### Refresh-trigger event

- `tenderCreated`

Behavior:
- signal that fresh list data exists
- rerun normal list fetching

## 16. Step-by-step real-time flow for `/tenders`

1. start authenticated real-time client
2. subscribe to the current user's private event stream
3. open the tenders page
4. attach handlers for tender events
5. when `tenderCreated` arrives:
   - mark that new tenders are available
6. when `bid` arrives:
   - patch the matching visible card
7. when `ended` arrives:
   - mark the matching card as ended
8. when `winnerChoosen` arrives:
   - finalize the matching card state
9. when `deleted` arrives:
   - mark the matching card as deleted
10. when `revived` arrives:
   - restore the matching card to active state
11. when `updated` arrives:
   - patch the matching card content
12. when leaving the tenders page:
   - remove tender-specific listeners
13. keep the user-level real-time connection alive until the broader app session ends

## 17. Interaction with normal fetching

Real-time updates do not replace normal fetching.

They work together:

- normal fetch builds the initial list
- real-time events patch visible cards
- creation events trigger refresh of the normal list pipeline

This separation is important:

- fetch remains the source of truth for the full list
- real-time keeps the visible UI current between fetches

## 18. Universal behavior summary

Universal model:

1. subscribe once per authenticated user
2. listen for tender events on the tenders page
3. match state events by secure tender id
4. match content updates by tender number / periodic
5. patch visible cards immediately for active tender events
6. treat new tender events as a refresh signal for the list pipeline
