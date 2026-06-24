# Tenders Page Step-by-Step Guide

This document explains only how to recreate the `/tenders` page.

It does **not** cover the tender details page.

Goal:
- explain what to fetch first
- explain how responses are matched together
- explain how to build tabs, filters, pagination, and card statuses
- explain which actions must refetch which data

## 1. Main idea

The tenders page is built in 2 stages:

1. Fetch a lightweight tender list for grouping, tab counts, filters, and pagination.
2. Fetch full card data only for the visible tender `periodic` values.

Important:
- Do not build cards directly from `getCurrentTenders` or `getMyTenders`.
- First use that list to decide which tenders belong to the active tab.
- Then request full card data for those selected tenders through `getBasicDetailsOfRoutes`.

## 2. Endpoints used by the tenders page

### Main list data

- `GET /getTenderGroups`
  - returns tab/group definitions

- `GET /getCurrentTenders`
  - default tenders source

- `GET /getMyTenders`
  - used instead of `getCurrentTenders` when "only my customers" is enabled

- `GET /getBasicDetailsOfRoutes?routes=<comma-separated periodic list>`
  - returns the full tender card data for the currently visible tenders

### Special tabs

- `GET /getNotInterested?tender=1`
  - hidden tenders tab

- `GET /getCompleteRoutes?page=<page>&perPage=<perPage>`
  - archive/completed tenders tab

### Card actions

- `GET /getTenderSteps?route=<periodic>`
- `POST /pricequote`
- `POST /bookmark`
- `POST /notInterested`
- `POST /cancelPricequote`
- `POST /revivePricequote`
- `GET /getPricequotes?route=<periodic>`

## 3. Step-by-step page load

Use this exact order.

### Step 1. Fetch tab definitions

Call:

- `GET /getTenderGroups`

This response defines the backend-backed tabs.

Each group contains `multistati`.
You will later match each tender against a group by checking whether:

```ts
group.multistati.includes(tender.contextstatus)
```

### Step 2. Fetch the lightweight tenders source

Call one of these:

- `GET /getCurrentTenders`
- `GET /getMyTenders`

Rules:
- use `getCurrentTenders` by default
- switch to `getMyTenders` when "only my customers" is turned on

This response is the source of truth for:
- tab membership
- tab counters
- quick filters
- detailed filters
- sorting base
- pagination source ids

This response is **not** the final card payload.

### Step 3. Choose the active tab

The page uses:

- backend groups from `getTenderGroups`
- one frontend-only hidden tab
- archive tab logic

Observed important ids in current implementation:

- `1` = Current
- `101` = Playing
- `6` = Archive

Hidden tab is a custom frontend tab id, not a backend group id.

### Step 4. Match tenders into groups

For every group from `getTenderGroups`:

1. Take all tenders from `getCurrentTenders` or `getMyTenders`
2. Put a tender into the group when:

```ts
group.multistati.includes(tender.contextstatus)
```

That gives you:
- group tender list
- group count

Archive is different:
- its count comes from `getCompleteRoutes.total`

Hidden is different:
- its list comes from `getNotInterested?tender=1`

### Step 5. Reorder the group list

Current implementation applies extra ordering:

- Current tab:
  - newly arrived tenders are moved to the top
- Playing tab:
  - reverse the group list
- Archive tab:
  - reverse the group list returned for rendering

If you recreate without Pusher:
- you can skip the "newly arrived tenders first" behavior
- but keep the normal date sort from the source list

### Step 6. Apply quick filters

Filters are applied in memory on the lightweight list, before requesting full card data.

Quick filters:

- `geographyContext`
- `freeforall`
- `blindtender`
- `clientCompany`
- `hidden`

A tender stays in the filtered list only if it matches all selected filters.

### Step 7. Apply detailed filters

Detailed filters are also applied in memory on the lightweight list.

Used fields:

- `clientCompany`
- `loading_points`
- `unloading_points`
- `cartype`
- `chargetype`
- `dates`

The current page also builds the detailed filter option lists from the currently matched tab list.

That means:
- first determine the active tab list
- then extract unique values from that list to build filter options

### Step 8. Build the visible tender id list

After grouping and filtering:

1. Take the matched tenders of the active tab
2. Extract `periodic`
3. Keep only filtered `periodic` values

Result:

- ordered filtered list of tender `periodic` values

This list is the source for card fetching.

### Step 9. Paginate on the frontend

Regular tabs:
- use page size `10`

Current implementation:

```ts
slice((page - 1) * 10, page * 10)
```

Archive tab:
- archive data already comes paged from the backend
- but the page still uses the resulting route list as the active tab data source

### Step 10. Fetch full card data

Now call:

- `GET /getBasicDetailsOfRoutes?routes=<comma-separated periodic ids>`

Example:

```txt
/getBasicDetailsOfRoutes?routes=12345,12346,12347
```

This is the payload used to render the actual tender cards.

Important:
- `getCurrentTenders` / `getMyTenders` decides *which* tenders are visible
- `getBasicDetailsOfRoutes` provides the *full card fields* for those tenders

### Step 11. Match card data back to the visible ids

Match by:

- `periodic` for selection before fetch
- `id` inside the returned detailed payload for card replacement/update

Practical rule:

1. Build the visible ordered `periodic` list first
2. Request `getBasicDetailsOfRoutes` for that exact list
3. Render cards in that same order

Current code updates the card list by route `id`, but the selection input is based on `periodic`.

## 4. Data matching rules

This is the most important part of the page.

### Source A: lightweight list

From:
- `getCurrentTenders`
- `getMyTenders`
- `getNotInterested?tender=1`
- `getCompleteRoutes`

Use it for:
- tab membership
- tab counts
- filtering
- sorting
- pagination
- visible `periodic` ids

### Source B: detailed card list

From:
- `getBasicDetailsOfRoutes?routes=...`

Use it for:
- card rendering
- bid states
- button states
- countdown state
- disabled state
- visible offer values

### How they are connected

Connection key:

- use `periodic` to decide which detailed items must be loaded

Flow:

1. lightweight source gives ordered filtered `periodic` ids
2. those ids are sent to `getBasicDetailsOfRoutes`
3. detailed response becomes the final card list

## 5. Special tab rules

### Current tab

Data source:
- `getCurrentTenders` or `getMyTenders`

Extra behavior:
- newly arrived tenders can be moved to the top

### Playing tab

Data source:
- still based on `getCurrentTenders` or `getMyTenders`

Group membership depends on:
- `contextstatus === 101` in practice through group matching

### Hidden tab

Data source:
- `getNotInterested?tender=1`

Rule:
- do not use the normal current-list items for hidden cards
- use the hidden endpoint as the tab source

### Archive tab

Data source:
- `getCompleteRoutes?page=<page>&perPage=<perPage>`

Rule:
- archive count comes from `total`
- archive cards are based on the completed endpoint response, not the normal current list

## 6. Required fields from the lightweight list

To recreate the page, these fields are needed from the lightweight source:

- `periodic`
- `contextstatus`
- `multicontextstatus`
- `tenderavailableuntilmoment`
- `geographyContext`
- `freeforall`
- `blindtender`
- `clientCompany`
- `loading_points`
- `unloading_points`
- `cartype`
- `chargetype`
- `dates`

From tender groups:

- `id`
- `title`
- `multistati`

## 7. Required fields from the card payload

To render cards correctly, the detailed payload needs at least:

- `id`
- `periodic`
- `routestatus`
- `tenderuntil`
- `tenderavailableuntilmoment_passed`
- `blindtender`
- `freeforall`
- `maxquotewithcommission`
- `minquote`
- `stepwithcommission`
- `routetender.winnerstatus`
- `routetender.pricefor`
- `routetender.totalcount`
- `routetender.currentminpricewithcommission`
- `routeresponse_relation`
- `tenderChildrenCount`
- `hasMyQuotes`

Plus the normal company/location/cargo/payment fields needed by the card UI.

## 8. Card status calculation

Tender card status is derived on the frontend from the detailed card payload.

### Constants

```ts
const DISABLED_ROUTE_STATUS = -1;
const IS_I_AM_TENDER_WINNER_STATUS = 2;
const IS_TENDER_HAVE_WINNER_STATUS = 1;
const IS_TENDER_HAVE_NO_WINNER_STATUS = 0;
```

### Input fields

- `routestatus`
- `routetender.winnerstatus`
- `minquote`
- `minquote.mine`
- `tenderavailableuntilmoment_passed`

### Derived states

```ts
const isRouteDisabled = routestatus === -1;
const isIamWinner = winnerstatus === 2;
const isTenderHaveWinner = winnerstatus === 1;
const isTenderHaveNoWinner = winnerstatus === 0;

const isLost = isRouteDisabled && isTenderHaveWinner && !isIamWinner;
const isLosing = !minquote?.mine && !!minquote && !isLost && !tenderavailableuntilmoment_passed;
const isWinning = !!minquote?.mine && !!minquote && !isLost && !tenderavailableuntilmoment_passed;
const isNoBid = !minquote;
const isWin = isIamWinner && !!minquote && isRouteDisabled;
const isWinnerNotDetermined = isTenderHaveNoWinner && isRouteDisabled;
const isWinnerNotDeterminedButFinished =
  isTenderHaveNoWinner && tenderavailableuntilmoment_passed;
```

### What each state means

- `isNoBid`
  - no bid yet

- `isLosing`
  - tender is active and the best bid is not mine

- `isWinning`
  - tender is active and the best bid is mine

- `isLost`
  - tender is closed, winner exists, and I lost

- `isWin`
  - tender is closed and I won

- `isWinnerNotDetermined`
  - tender is closed but winner was not selected

- `isWinnerNotDeterminedButFinished`
  - deadline passed and winner still not selected

### Bid button disable rule

```ts
const isBidSheetDisable =
  isWinning ||
  isLost ||
  isWin ||
  isWinnerNotDetermined ||
  tenderavailableuntilmoment_passed;
```

Blind tender exceptions:

- if blind tender has no bid yet, bid is still allowed
- if blind tender already has a bid, show change/cancel/restore actions instead of the normal flow

## 9. Action flows on the tenders page

Without Pusher, after every action you must refetch the affected list/card queries.

### 9.1 Place bid

1. `GET /getTenderSteps?route=<periodic>`
2. `POST /pricequote`
3. Refetch:
   - current `getBasicDetailsOfRoutes` batch if it contains that `periodic`
   - lightweight list source (`getCurrentTenders` or `getMyTenders`)
4. Rebuild grouping, filters, and current page card ids

Current implementation also moves the tender into Playing behavior by updating:
- `contextstatus = 101`
- `multicontextstatus += 101`

### 9.2 Follow / unfollow tender

1. `POST /bookmark`
2. Refetch:
   - lightweight list source
   - current `getBasicDetailsOfRoutes` batch when needed
3. Rebuild tabs and visible cards

Current implementation behavior:
- follow on sets `contextstatus = 101`
- follow off sets `contextstatus = 91`

### 9.3 Hide / restore tender

1. `POST /notInterested`
2. Refetch:
   - lightweight list source
   - hidden list source (`getNotInterested?tender=1`)
3. Rebuild tabs, counts, and visible cards

### 9.4 Blind tender cancel bid

1. `POST /cancelPricequote`
2. Refetch:
   - lightweight list source if card grouping may change
   - current `getBasicDetailsOfRoutes` batch

### 9.5 Blind tender restore bid

1. `POST /revivePricequote`
2. Refetch:
   - lightweight list source if needed
   - current `getBasicDetailsOfRoutes` batch

### 9.6 Open all offers

1. `GET /getPricequotes?route=<periodic>`
2. render offers sheet

## 10. Recommended implementation recipe

If you build this page from scratch, use this algorithm:

1. Fetch `getTenderGroups`
2. Fetch `getCurrentTenders` or `getMyTenders`
3. Pick active tab
4. Build that tab's tender list by matching `contextstatus` into `multistati`
5. If hidden tab: switch source to `getNotInterested?tender=1`
6. If archive tab: switch source to `getCompleteRoutes`
7. Apply quick filters
8. Apply detailed filters
9. Extract ordered filtered `periodic` ids
10. Slice by page
11. Fetch `getBasicDetailsOfRoutes` for those visible ids
12. Render cards from the detailed response
13. Derive every card state from `routestatus`, `winnerstatus`, `minquote`, and `tenderavailableuntilmoment_passed`
14. After any user action, refetch affected sources and rebuild the same pipeline

## 11. Source files used for this guide

- `src/pages/Tenders.tsx`
- `src/components/unit/Tender/TenderListCard.tsx`
- `src/query/query/tendersQuery.ts`
- `src/query/query/basicDetailOfRoutesQuery.ts`
- `src/query/query/completedTendersQuery.ts`
- `src/query/query/notInterestedQuery.ts`
- `src/query/mutation/pricequoteQuery.tsx`
- `src/query/mutation/tenderStepsMutationQuery.ts`
- `src/query/mutation/bookmarkMutationQuery.tsx`
- `src/query/mutation/notInterestedMutationQuery.tsx`
- `src/query/mutation/cancelPricequoteMutationQuery.tsx`
- `src/query/mutation/retrivePricequoteMutationQuery.tsx`
- `src/query/mutation/pricequotesMutationQuery.ts`
- `src/consts/routePaths.ts`
- `src/consts/tenderRouteStatuses.ts`
