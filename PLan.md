# SmartTute Playground & Lobby — Implementation Plan

## 1. Objective

Implement a new **Playgrounds** module in SmartTute.

A Playground is a temporary virtual lobby hosted by a teacher. Students join by scanning a QR code or entering a short join code. Students appear inside the lobby as animated full-body cartoon characters.

For this phase, the Playground is primarily a **lobby experience**.

The actual game/question execution is NOT required yet.

When the teacher starts the Playground, show an alert indicating that the host has started it.

The implementation must be modular so the local V1 can later be replaced with a real backend/realtime system using WebSockets/Socket.IO without redesigning the frontend.

---

# 2. Important Existing SmartTute Context

The application already uses:

* React
* Vite
* JavaScript
* CSS
* React Router
* Lucide React
* LocalStorage
* Existing SmartTute branding system
* Existing student onboarding
* Existing full-body avatar system

Do NOT introduce:

* TypeScript
* Next.js
* Redux
* Tailwind
* Docker
* unnecessary state-management frameworks
* unnecessary backend dependencies

Keep the implementation lightweight and modular.

---

# 3. Main User Flows

## Teacher Flow

```text
Teacher
   ↓
Playgrounds
   ↓
Create Playground
   ↓
Enter playground name
   ↓
Playground created
   ↓
Lobby opens
   ↓
Display QR code + short join code
   ↓
Students join
   ↓
Students appear as animated avatars
   ↓
Teacher waits
   ↓
Click "Start Playground"
   ↓
V1: Show alert
```

## Student Flow

```text
Student scans QR
       ↓
Join URL opens
       ↓
Check local SmartTute student data
       │
       ├── Student exists
       │       ↓
       │   Reuse name + avatar
       │
       └── Student doesn't exist
               ↓
          Enter name
               ↓
          Select avatar
               ↓
       Save student profile
               ↓
          Enter lobby
               ↓
     Full-body avatar appears
        at random position
               ↓
        Spawn animation
               ↓
         Idle animation
               ↓
      Can edit character
               ↓
       Waiting for host
```

---

# 4. New Navigation Tab

Add a new top-level navigation item:

```text
Playgrounds
```

The teacher navigation should contain:

```text
Dashboard
Tutes
Playgrounds
```

Use an appropriate Lucide icon such as:

```text
Gamepad2
```

or another suitable playground/game icon.

Do not add future unfinished navigation items.

---

# 5. Routes

Add these routes:

```text
/playgrounds
/playgrounds/new
/playgrounds/:id
/playgrounds/join/:code
```

Recommended behavior:

### `/playgrounds`

Teacher's Playground management page.

### `/playgrounds/new`

Create a new Playground.

### `/playgrounds/:id`

Teacher lobby/host view.

### `/playgrounds/join/:code`

Student join flow and student lobby.

Do not require teacher authentication/backend authentication in V1.

---

# 6. Playground Data Model

Create a Playground model similar to:

```js
{
  id: "playground_001",

  name: "Algebra Challenge",

  joinCode: "7K4P2",

  status: "waiting",

  createdAt: "2026-09-08T10:00:00.000Z",

  updatedAt: "2026-09-08T10:00:00.000Z",

  participants: []
}
```

Possible status values:

```text
waiting
started
finished
```

For V1, primarily use:

```text
waiting
started
```

---

# 7. Participant Data

A participant should contain:

```js
{
  participantId: "participant_random_id",

  name: "Nimal",

  avatar: {
    body: "...",
    face: "...",
    hair: "...",
    clothes: "...",
    pants: "...",
    shoes: "...",
    hat: "...",
    accessory: "..."
  },

  position: {
    x: 65,
    y: 38
  },

  animation: "idle"
}
```

Important:

* `x` and `y` are percentages.
* Do NOT use fixed pixel coordinates.
* Participant positions must remain stable during the lobby session.
* Existing participants should not randomly move every time React renders.

---

# 8. LocalStorage

Create or extend the existing storage system.

Use:

```text
smarttute_playgrounds
```

for Playground data.

Continue using the existing student storage system for:

```text
smarttute_student
```

Do NOT create a second student profile system.

The existing SmartTute student profile should be reused.

---

# 9. Playground Storage Functions

Create:

```js
getPlaygrounds()
getPlayground(id)
getPlaygroundByCode(code)
savePlayground(playground)
updatePlayground(id, partial)
deletePlayground(id)
```

Also create helper functions where useful:

```js
generatePlaygroundId()
generateJoinCode()
```

Join codes should be:

* short
* easy to read
* uppercase
* preferably 5–6 characters
* avoid confusing characters such as `O`, `0`, `I`, `1` where practical

Example:

```text
7K4P2
M8R5X
```

---

# 10. Playground Management Page

Route:

```text
/playgrounds
```

Create:

```text
Playgrounds.jsx
```

The page should allow the teacher to:

* View existing Playgrounds
* Create Playground
* Open a Playground
* Delete a Playground

Example layout:

```text
Playgrounds

[ + Create Playground ]

Active / Recent

┌──────────────────────────────────────────┐
│ Algebra Challenge                        │
│ Code: 7K4P2                              │
│ Waiting                                  │
│                                          │
│ [ Open Lobby ]       [ Delete ]          │
└──────────────────────────────────────────┘
```

Keep the UI clean and consistent with SmartTute.

---

# 11. Create Playground

Route:

```text
/playgrounds/new
```

Create:

```text
CreatePlayground.jsx
```

Fields:

```text
Playground Name
[________________________]

[ Create Playground ]
```

On creation:

1. Validate name.
2. Generate unique ID.
3. Generate unique join code.
4. Set status to `waiting`.
5. Set created/updated timestamps.
6. Save to LocalStorage.
7. Navigate to `/playgrounds/:id`.

Do not ask for Tute selection yet unless the existing architecture already requires it.

The current Playground should remain independent from the Tute system.

Future versions can associate a Playground with a Tute.

---

# 12. Teacher Lobby

Route:

```text
/playgrounds/:id
```

Create:

```text
TeacherPlayground.jsx
```

The teacher lobby should show:

```text
┌──────────────────────────────────────────────┐
│ Algebra Challenge                            │
│                                              │
│ Join Code: 7K4P2                             │
│                                              │
│                 [ QR CODE ]                  │
│                                              │
│        Students in Playground               │
│                                              │
│       animated character space              │
│                                              │
│                                              │
│             [ Start Playground ]             │
└──────────────────────────────────────────────┘
```

The main visual area should be the Playground.

Do NOT use a simple student table as the primary lobby representation.

Students should appear as characters.

---

# 13. QR Code

Generate a QR code that points to:

```text
/playgrounds/join/:code
```

Use the current application's origin.

For example:

```text
https://smarttute.example/playgrounds/join/7K4P2
```

Do not hardcode the production domain.

Build the URL dynamically:

```js
const joinUrl =
  `${window.location.origin}/playgrounds/join/${playground.joinCode}`;
```

The QR code should be large enough to scan from a classroom display.

Include the short code underneath:

```text
Scan to Join

[ QR CODE ]

7K4P2
```

Students can therefore join using either:

* QR
* manual short code

---

# 14. Student Join Page

Route:

```text
/playgrounds/join/:code
```

Create:

```text
JoinPlayground.jsx
```

First:

1. Read `code` from the URL.
2. Find the Playground.
3. Validate that it exists.
4. Validate that it accepts joins.
5. Check existing SmartTute student data.

---

# 15. Existing Student Detection

Use the existing student LocalStorage data.

If a completed student profile exists:

```text
student exists
```

then reuse:

```text
fullName
nickname
avatar
```

Do NOT ask the student to enter their name or select their avatar again.

The join experience should be quick.

Example:

```text
Welcome back, Nimal! 👋

Joining Algebra Challenge...

[ Enter Playground ]
```

Alternatively, enter automatically after the Playground is validated.

---

# 16. New Student Join

If no student profile exists:

Show:

```text
Welcome to SmartTute Playground!

What's your name?

[____________________]

Choose your character

[ Avatar 1 ]
[ Avatar 2 ]
[ Avatar 3 ]
[ Avatar 4 ]

[ Enter Playground ]
```

The student must:

* enter a name
* select an avatar

Nickname may be omitted from this flow unless the existing student profile system requires it.

Save the new profile using the existing SmartTute student storage system.

---

# 17. Avatar System Integration

Reuse the existing SmartTute avatar system.

Do NOT create a separate Playground avatar implementation.

The Playground should render the existing full-body avatar data.

Existing avatar structure:

```js
{
  body,
  face,
  hair,
  clothes,
  pants,
  shoes,
  hat,
  accessory
}
```

The Playground character must be:

* full-body
* head visible
* feet visible
* responsive
* consistent with the existing SmartTute avatar style

Do not stretch upper-body assets to create full-body characters.

---

# 18. Avatar Editing Inside Lobby

Students must be able to edit their character while inside the lobby.

Add:

```text
[ Edit Character ]
```

to the student's lobby interface.

Clicking it should open/reuse:

```text
AvatarEditor
```

Do NOT build a second avatar customization system.

The editor should support the currently available customization:

* skin tone
* hair style
* hair color
* clothing/shirt color
* other existing avatar options

After saving:

```text
AvatarEditor
      ↓
Update Student Profile
      ↓
Update Current Playground Participant
      ↓
Character changes immediately
```

---

# 19. Name Editing

Allow the student to edit their display name from the lobby.

Example:

```text
Nimal
[ Edit Name ]
```

When changed:

1. Update student profile.
2. Update current Playground participant.
3. Update visible name label.

Do not require leaving/rejoining the Playground.

---

# 20. Playground Visual Area

Create:

```text
PlaygroundStage.jsx
```

This is the main virtual space.

It should be:

* responsive
* visually attractive
* lightweight
* suitable for 20–50 characters
* compatible with desktop/tablet/mobile

Example:

```text
┌──────────────────────────────────────────┐
│                                          │
│       🧑                    👩           │
│      /█\                  /█\           │
│      / \                  / \           │
│                                          │
│                    🧑                    │
│                   /█\                    │
│                   / \                    │
│                                          │
│   👩                            🧑       │
│  /█\                           /█\       │
│  / \                           / \       │
│                                          │
└──────────────────────────────────────────┘
```

The actual existing SmartTute avatar renderer should replace the example characters.

---

# 21. Random Character Position

When a participant enters:

1. Generate a random position.
2. Make sure it is inside safe boundaries.
3. Avoid excessive overlap with existing participants.
4. Save the position.
5. Render the participant there.

Use percentages:

```js
{
  x: 63,
  y: 42
}
```

Do not use:

```js
{
  x: 350,
  y: 240
}
```

Recommended safe ranges:

```text
x: approximately 8%–88%
y: approximately 15%–75%
```

Adjust based on character dimensions.

---

# 22. Position Collision

Implement a lightweight collision/spacing check.

The purpose is not perfect physics.

It only needs to prevent obviously overlapping characters.

Algorithm:

```text
Generate random position
        ↓
Compare with existing positions
        ↓
Too close?
   │
   ├── Yes → Generate another position
   │
   └── No → Accept position
```

Use a maximum number of attempts.

If no ideal position is found, accept the best available position.

---

# 23. Character Name Labels

Every character should have a small name label.

Example:

```text
        Nimal
         🧑
        /█\
        / \
```

The label should:

* remain readable
* remain attached to the character
* not move independently
* scale appropriately
* work on mobile

Use the student's display name.

---

# 24. Character Animations

Characters should feel alive.

Implement lightweight CSS-based animations.

Avoid heavy continuous JavaScript animation loops.

---

## 24.1 Spawn Animation

When a student enters:

```text
fade in
+
scale from slightly smaller
+
small upward movement
```

Example:

```text
      ↓

      🧑
     /█\
     / \

      ↑

      🧑
     /█\
     / \
```

The animation should be short.

---

## 24.2 Idle Animation

Every character should have a subtle looping idle animation.

Possible effects:

* slight vertical movement
* subtle body movement
* slight head movement
* gentle breathing/bounce

Use CSS:

```css
.character--idle {
  animation: characterIdle 3s ease-in-out infinite;
}
```

Keep the movement subtle.

---

## 24.3 Random Actions

Occasionally trigger a short random action.

Possible actions:

```text
wave
jump
celebrate
look
bounce
```

Each character should independently choose occasional actions.

Do not trigger all characters simultaneously.

---

# 25. Animation Architecture

Create:

```text
PlaygroundCharacter.jsx
CharacterAnimation.jsx
```

or keep animation logic inside `PlaygroundCharacter` if it remains small.

Recommended structure:

```text
PlaygroundStage
    │
    └── PlaygroundCharacter
           ├── Avatar
           ├── NameLabel
           └── AnimationController
```

Animation states:

```text
spawn
idle
wave
jump
celebrate
```

Use CSS classes:

```text
character--spawn
character--idle
character--wave
character--jump
character--celebrate
```

Use `transform` and `opacity` for animations wherever possible.

---

# 26. Performance

The lobby may contain many students.

Design for approximately:

```text
20–50 characters
```

Avoid:

* requestAnimationFrame loops for every character
* expensive SVG manipulation
* unnecessary React re-renders
* continuously updating position state
* large animation libraries

Prefer:

* CSS animations
* CSS transforms
* local component state
* stable participant data
* memoized character components where useful

---

# 27. Edit Character Animation

When a student saves a new avatar:

```text
Avatar changes
      ↓
Small celebrate/bounce animation
      ↓
Return to idle
```

This gives feedback that the change was successful.

---

# 28. Teacher Start Button

Teacher lobby should have:

```text
[ Start Playground ]
```

When clicked:

```js
alert("Host started the playground!");
```

For V1 this is enough.

Do NOT implement:

* question delivery
* game engine
* scoring
* XP
* coins
* timers
* leaderboards
* multiplayer gameplay

Those belong to future phases.

Set:

```text
status = "started"
```

when the button is clicked.

---

# 29. Student Waiting State

While the Playground has not started:

Show something like:

```text
Waiting for host...

The host will start the playground soon.
```

Once the teacher starts it, the student can display:

```text
The host has started the playground!
```

For the initial V1 implementation, this can be simulated locally.

Do not pretend this is real-time synchronization.

---

# 30. Important V1 Limitation

The current implementation is local-first.

Because there is no backend/realtime service yet:

* Teacher and student browsers do NOT actually share LocalStorage.
* A student joining on another device cannot automatically appear in the teacher's browser.
* QR code only navigates the student to the join URL.
* Real classroom synchronization is a future backend feature.

Therefore, structure the application so the **Playground UI and participant/session logic are independent from the storage/realtime implementation**.

Create a service abstraction such as:

```text
playgroundService.js
```

with functions such as:

```js
createPlayground()
getPlayground()
joinPlayground()
updateParticipant()
startPlayground()
```

Initially these can use LocalStorage/mock data.

Later they can be replaced by:

```text
REST API
+
WebSocket / Socket.IO
```

without rewriting the UI.

---

# 31. Future Realtime Architecture

Do NOT implement this now.

Prepare the architecture for:

```text
Teacher Browser
       │
       │ WebSocket
       ▼
Realtime Server
       ▲
       │ WebSocket
       │
Student Browsers
```

Future events could include:

```text
playground:join
playground:leave
participant:update
participant:avatar
playground:start
playground:end
```

The current frontend should avoid tightly coupling components to LocalStorage.

---

# 32. Responsive Design

The Playground must work on:

```text
375px phone
768px tablet
1280px desktop
```

Desktop:

```text
Header
────────────────────────────────────────

        Large Playground Stage

────────────────────────────────────────
QR / code / controls
```

Mobile:

```text
Header

Playground Stage

Students

Join Code / QR

Controls
```

Avoid horizontal overflow.

Characters should scale appropriately.

Do not allow character heads or feet to be cropped.

---

# 33. QR Display Responsiveness

Desktop:

* large QR
* join code clearly visible

Mobile:

* QR remains scannable
* controls stack vertically

Teacher should also be able to clearly read:

```text
JOIN CODE
7K4P2
```

---

# 34. Component Structure

Recommended structure:

```text
src/
│
├── components/
│   │
│   ├── playground/
│   │   ├── PlaygroundStage.jsx
│   │   ├── PlaygroundCharacter.jsx
│   │   ├── CharacterName.jsx
│   │   ├── CharacterAnimation.jsx
│   │   ├── PlaygroundQR.jsx
│   │   ├── JoinCode.jsx
│   │   ├── ParticipantPanel.jsx
│   │   └── PlaygroundControls.jsx
│   │
│   └── avatar/
│       └── existing avatar components
│
├── pages/
│   ├── Playgrounds.jsx
│   ├── CreatePlayground.jsx
│   ├── TeacherPlayground.jsx
│   └── JoinPlayground.jsx
│
├── services/
│   └── playgroundService.js
│
├── utils/
│   ├── playgroundUtils.js
│   ├── joinCode.js
│   └── randomPosition.js
│
└── storage/
    └── storage.js
```

Adapt this to the project's existing folder structure rather than unnecessarily moving existing files.

---

# 35. QR Library

Use a small established React-compatible QR-code library if one is not already installed.

Do not implement QR generation manually.

The QR should encode the dynamic join URL.

---

# 36. State Management

Do not introduce Redux.

Use:

* React state
* React context only if genuinely useful
* existing storage utilities
* service abstraction

Keep state local to the Playground where possible.

---

# 37. Error Handling

Handle:

### Invalid Playground

```text
Playground not found.

[ Back to Playgrounds ]
```

### Invalid join code

```text
Invalid Playground Code.
```

### Missing student name

```text
Please enter your name.
```

### Missing avatar

```text
Please select a character.
```

### Storage failure

Show a user-friendly error rather than crashing React.

---

# 38. Accessibility

Support:

* keyboard navigation
* visible focus states
* buttons with meaningful labels
* accessible modal close behavior
* Escape to close avatar editor
* sufficient text contrast
* reduced-motion preference

If:

```css
prefers-reduced-motion
```

is enabled, reduce or disable decorative character animations.

---

# 39. Security / Validation

Even though V1 is local-first:

* validate Playground IDs
* validate join codes
* sanitize displayed names
* do not inject arbitrary HTML
* do not use unsafe `dangerouslySetInnerHTML`
* do not trust URL parameters blindly

Student names should be treated as plain text.

---

# 40. UI Design

Follow the existing SmartTute visual language:

Colors:

```text
Primary Light Blue: #7DD3FC
Deep Blue:          #38BDF8
Purple:             #A78BFA
Deep Purple:        #8B5CF6
Pink:               #F472B6
Bright Pink:        #EC4899
Background:         #F8FAFC
Card:               #FFFFFF
Text:               #1E293B
```

Overall:

* soft gradient backgrounds
* rounded cards
* subtle shadows
* modern typography
* playful but not childish
* generous spacing
* responsive layouts

The Playground itself can have a slightly more playful visual treatment than the normal dashboard.

---

# 41. Recommended Playground Background

Do not make the lobby look like a plain dashboard.

Use a lightweight virtual-space appearance.

For example:

```text
soft gradient
+
subtle decorative shapes
+
large open stage
+
animated characters
```

Do not use heavy background video or complex 3D scenes.

The characters should remain the visual focus.

---

# 42. Student Identity Rules

The browser's SmartTute student profile is the student's reusable local identity.

If it exists:

```text
name
+
avatar
```

are reused automatically.

If it does not exist:

```text
name
+
avatar
```

must be collected.

After collection, save them to the existing SmartTute student profile.

When the student edits the avatar:

```text
Student Profile
       +
Current Playground Participant
```

must both be updated.

---

# 43. Do Not Create Duplicate Avatar Logic

The Playground must reuse:

```text
AvatarPreview
AvatarEditor
avatar configuration
avatar rendering logic
```

from the existing SmartTute system.

If modifications are required, improve the shared avatar components rather than creating Playground-specific copies.

---

# 44. Implementation Order

Implement in this order.

## Phase 1 — Data Layer

1. Playground storage key.
2. Playground model.
3. Playground storage functions.
4. Join-code generator.
5. Playground service abstraction.

## Phase 2 — Navigation

1. Add Playgrounds tab.
2. Add routes.
3. Add page shells.

## Phase 3 — Playground Management

1. Playground list.
2. Create Playground.
3. Open Playground.
4. Delete Playground.

## Phase 4 — Teacher Lobby

1. Teacher Playground page.
2. Join code.
3. QR code.
4. Empty lobby state.
5. Start button.

## Phase 5 — Student Joining

1. Join URL.
2. Playground validation.
3. Existing student detection.
4. New student name/avatar flow.
5. Participant creation.

## Phase 6 — Playground Stage

1. PlaygroundStage.
2. Full-body avatar rendering.
3. Name labels.
4. Random position.
5. Position collision/spacing.

## Phase 7 — Animation

1. Spawn animation.
2. Idle animation.
3. Random actions.
4. Avatar change animation.
5. Reduced-motion support.

## Phase 8 — Avatar Editing

1. Reuse AvatarEditor.
2. Open from lobby.
3. Save changes.
4. Update student profile.
5. Update current participant.
6. Refresh character immediately.

## Phase 9 — Name Editing

1. Edit display name.
2. Update student profile.
3. Update participant.
4. Update label.

## Phase 10 — Responsive Polish

Test:

```text
375px
768px
1280px
```

Fix:

* overflow
* cropped avatars
* QR sizing
* controls
* text
* stage sizing

---

# 45. Testing Checklist

## Teacher

* [ ] Playgrounds tab appears.
* [ ] Create Playground works.
* [ ] Unique join code generated.
* [ ] QR code generated.
* [ ] Lobby opens.
* [ ] Start Playground shows required alert.
* [ ] Playground status changes to started.
* [ ] Delete works.
* [ ] Refresh preserves Playground data.

## Student

* [ ] QR join URL works.
* [ ] Valid join code opens lobby.
* [ ] Invalid code shows error.
* [ ] Existing student data is detected.
* [ ] Existing avatar is reused.
* [ ] Existing name is reused.
* [ ] New student can enter name.
* [ ] New student can select avatar.
* [ ] New profile is saved.
* [ ] Student enters lobby.

## Avatar

* [ ] Full body visible.
* [ ] Head visible.
* [ ] Feet visible.
* [ ] Character positioned correctly.
* [ ] Character does not distort.
* [ ] Avatar editor opens.
* [ ] Avatar changes immediately.
* [ ] Changes persist.

## Animation

* [ ] Spawn animation works.
* [ ] Idle animation loops.
* [ ] Random actions work.
* [ ] Animations do not cause layout movement.
* [ ] Multiple characters remain performant.
* [ ] Reduced-motion preference works.

## Responsive

* [ ] 375px works.
* [ ] 768px works.
* [ ] 1280px works.
* [ ] No horizontal scrolling.
* [ ] QR remains usable.
* [ ] Characters are not cropped.

---

# 46. Verification Commands

Run:

```bash
npm run lint
```

Then:

```bash
npm run build
```

Fix all errors and warnings that are caused by the implementation.

Also manually test:

```text
Teacher → Create Playground
Teacher → Open Lobby
Student → Join
Student → Existing Profile
Student → New Profile
Student → Edit Avatar
Student → Edit Name
Teacher → Start
Refresh pages
Direct URL navigation
Invalid join code
Mobile viewport
```

---

# 47. V1 Scope Boundary

Do NOT implement yet:

* backend
* MongoDB
* WebSockets
* Socket.IO
* real-time teacher/student synchronization
* authentication
* game engine
* Tute/question integration
* XP
* coins
* rewards
* leaderboards
* teams
* player movement controls
* multiplayer physics
* voice chat
* text chat
* complex 3D environment
* advanced character rigging

The goal of this phase is:

> **Build a polished Playground/Lobby frontend and a clean abstraction that can later become a real-time multiplayer system.**

---

# 48. Final Architecture

```text
                         SMARTTUTE
                             │
              ┌──────────────┼──────────────┐
              │              │              │
           Dashboard        Tutes       Playgrounds
                                             │
                                      Playground Service
                                             │
                                      LocalStorage V1
                                             │
                         ┌───────────────────┴──────────────────┐
                         │                                      │
                     Teacher                                  Student
                         │                                      │
                   Create Lobby                            Scan QR / Code
                         │                                      │
                   QR + Code                              Check Profile
                         │                                      │
                         │                         ┌────────────┴───────────┐
                         │                         │                        │
                         │                    Existing                  New
                         │                         │                        │
                         │                         │                  Name + Avatar
                         │                         │                        │
                         └──────────────┬──────────┴────────────────────────┘
                                        │
                                        ▼
                                Playground Stage
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                    Full-body       Random          Animation
                     Avatar         Position          System
                         │              │              │
                         └──────────────┼──────────────┘
                                        │
                                  Edit Character
                                        │
                                        ▼
                                  Existing Avatar
                                      Editor
```

The most important architectural rule is:

> **The Playground UI must not depend directly on LocalStorage.**

Use a `playgroundService` layer so V1 can use LocalStorage while a future version can replace it with a backend + WebSocket implementation.

The Playground should therefore be treated as the first step toward SmartTute's future **real-time classroom/game environment**, not merely as another page.
