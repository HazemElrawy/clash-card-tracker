# Clash Card Tracker

Build a simple, polished web app for my personal use called Clash of Cards Tracker.

I have uploaded a screenshot from the current Clash of Clans “Clash of Cards” event. Use that screenshot as the primary visual reference for the interface. The goal is to make the tracker visually resemble the in-game event screen as closely as practical, because I want to be able to open the app beside the game screenshot and compare them quickly.

Core purpose

I have 5 Clash of Clans accounts and want one place where I can manually record which event cards each account owns and how many copies/duplicates I have.

The app should let me:

Select one of my 5 accounts.

See the complete card collection in a layout similar to the Clash of Clans event screen.

Mark cards as owned/unowned.

Record the quantity of each card.

See collection progress.

Quickly switch between my 5 accounts.

See a combined comparison across all 5 accounts, especially which accounts have or are missing each card.

This is Version 1, so prioritize simplicity, reliability, and a polished interface over advanced features.

1. IMPORTANT: VISUAL DESIGN

The uploaded screenshot should be treated as the main design reference.

I want the main collection screen to feel like the actual Clash of Clans event screen:

Large centered event panel.

Similar overall proportions and spacing.

Similar category tabs at the top.

Four card categories:

Elixir Cards

Dark Elixir Cards

Builder Base Cards

Super Troop Cards

Card tiles arranged in a clean grid.

Large card artwork area.

Similar rounded borders, shadows, spacing, and visual hierarchy.

Similar progress indicators.

Similar overall game-like appearance.

Do NOT turn this into a generic modern SaaS dashboard.

The UI should feel like a companion tracker for the game, not a business application.

At the same time, keep it readable and practical on a normal desktop browser.

Use the uploaded screenshot to guide:

layout

proportions

card size

spacing

tab appearance

typography hierarchy

progress bar placement

overall visual composition

Do not reproduce unrelated parts of the Clash of Clans village/background visible outside the event window. Concentrate on the event interface itself.

2. EVENT STRUCTURE

The event contains exactly 60 card types divided into these categories:

Elixir Cards: 19

Dark Elixir Cards: 13

Builder Base Cards: 11

Super Troop Cards: 17

Total: 60 cards

The category tabs should display the progress for the currently selected account, for example:

Elixir Cards 9/19

Dark Elixir Cards 7/13

Builder Base Cards 7/11

Super Troop Cards 4/17

The progress values should be calculated automatically from that account's data.

For Version 1, structure the data so that the complete 60-card catalog can easily be edited/expanded later.

If the exact complete card list cannot be reliably determined from the uploaded screenshot alone, create the data model so the card names and images can easily be populated/changed later rather than inventing incorrect card names.

3. CARD TILE DESIGN

Each card should be represented by a large visual card tile.

Each tile should support:

Card artwork/image

Card name

Owned/unowned state

Quantity/duplicate count

I want the card itself to remain visually prominent.

When a card is not owned:

visually dim it or otherwise make its missing state obvious.

When a card is owned:

display it normally.

show the quantity clearly.

For example:

Archer
x1

or

Skeleton Army
x2

The quantity should be easy to update.

Clicking a card should provide a very simple interaction for changing its quantity.

Use a sensible interaction such as:

click card → small control appears

− / quantity / +

Do not make the user navigate to a separate settings page just to change a card quantity.

4. ACCOUNT SYSTEM

Because this is Version 1 and only for me, do not build authentication or a server-based user system yet.

Instead, create exactly 5 local accounts:

Account 1

Account 2

Account 3

Account 4

Account 5

I should be able to rename them.

For example:

Main

TH16

Donation

Mini 1

Mini 2

The selected account should be very obvious at the top of the page.

Provide a simple account selector/dropdown or account buttons.

Switching accounts must instantly load that account's card collection.

All five accounts must retain their own independent data.

5. COMBINED / COMPARISON VIEW

This is an important feature.

Add a “Compare Accounts” view.

The purpose is to help me answer questions such as:

“Which account has Archer and which accounts are missing Archer?”

For every card, show its status across all five accounts.

For example:

CardAccount 1Account 2Account 3Account 4Account 5Archer✓ x1—✓ x2—✓ x1

Use a visually compact representation rather than a huge spreadsheet-like interface.

The comparison should make it immediately obvious:

who owns the card

who is missing it

how many copies each account has

Also include useful aggregate information such as:

Accounts owning this card: 3/5

and optionally:

Missing from: Account 2, Account 4

This comparison view should be especially useful when I am deciding which account needs which cards.

6. OVERALL COLLECTION SUMMARY

For the currently selected account, prominently show:

Cards Collected: X/60

Calculate this automatically.

Define a card as “collected” when its quantity is greater than 0.

Also show the four category totals:

Elixir: X/19

Dark Elixir: X/13

Builder Base: X/11

Super Troop: X/17

Include a progress bar similar in spirit to the game's event progress bar.

The reward markers visible in the screenshot can be visually represented as placeholders or simplified markers for Version 1. They do not need to be functional yet.

7. DATA STORAGE

Because this is for my personal use right now:

Store all data locally in the browser.

Use localStorage or another robust browser-local persistence method.

Data must survive refreshing the page.

Data must survive closing and reopening the browser.

Each of the 5 accounts must have independent card data.

Also provide:

Export Data

and

Import Data

using JSON.

This is important so I can back up my collection and move it to another browser/device later.

Do not introduce a backend/database unless it is genuinely necessary for the requested Version 1 functionality.

8. NAVIGATION

Keep navigation extremely simple.

Main interface:

Collection

Shows the selected account's cards.

Compare

Shows the five-account comparison.

Settings

Allows:

Rename accounts

Reset an account

Export data

Import data

Reset all data

Do not build unnecessary pages.

9. RESPONSIVENESS

The primary target is desktop because I will often compare this against Clash of Clans screenshots.

However, make it reasonably usable on mobile/tablet as well.

On smaller screens:

preserve the card artwork

allow scrolling

avoid cards becoming impossibly small

keep account switching easy

10. IMPORTANT FUTURE-PROOFING

Do NOT implement image recognition yet.

However, structure the code/data model so that a future Version 2 can support:

Upload Clash of Clans screenshot → automatically detect the cards and quantities → review detected results → apply them to the selected account.

The card catalog should therefore have a stable unique ID for every card.

For example:

card_id
name
category
image


And account ownership should be stored separately:

account_id
card_id
quantity


This will make future screenshot recognition much easier to add.

11. FUTURE-FRIENDLY ARCHITECTURE

Keep the implementation clean and modular.

I expect to add these features later, so don't create an architecture that makes them difficult:

Version 2:

Screenshot import

Automatic card recognition

Automatic duplicate detection

Version 3:

Cloud storage

User accounts/login

Share with clan members

Version 4:

Clan-wide card comparison

“Who has this card?”

Trading/donation-style discovery

For now, however, do not build any of those features.

12. UX DETAILS

The app should feel fast and effortless.

I want to be able to do this repeatedly:

Select Account 1.

Look at Clash of Clans.

Update cards.

Select Account 2.

Update cards.

Repeat.

Therefore:

minimize clicks

don't use complicated forms

don't force confirmation dialogs for every tiny quantity change

save changes immediately

keep the selected account visible

keep category progress visible

A card quantity of 0 means the card is missing.

A quantity greater than 0 means it is collected.

Use + and − controls and never allow the quantity to go below 0.

13. INITIAL DATA

Use the uploaded screenshot to create the initial visual state where practical.

The screenshot shows an example collection with:

Elixir Cards: 9/19

Dark Elixir Cards: 7/13

Builder Base Cards: 7/11

Super Troop Cards: 4/17

Overall: 27/60

Use these values as the initial data for Account 1 only if the individual card states can be inferred reliably from the screenshot.

Do not fabricate card ownership data that cannot be determined.

Accounts 2–5 can start empty.

14. QUALITY BAR

Before considering Version 1 complete:

The app must actually work, not just look good.

Account switching must work.

Card quantities must persist.

Progress totals must be calculated correctly.

Compare view must reflect the actual stored data.

Export/import must work.

Reset functions must work.

The interface should closely resemble the uploaded Clash of Clans screenshot.

Avoid unnecessary dependencies and unnecessary complexity.

Most importantly:

Build the smallest polished version that solves my personal tracking problem well.

Do not add features just because they are possible.

Start by building the complete working Version 1 rather than stopping at a mockup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b2d42b68-c7cb-4da2-a93a-b1ea05cab244).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
