# Problem Statement — Async Smart Component Handling in Journey Builder

**Document type:** Problem Statement Only — No Solution  
**Date:** 2026-06-03  
**Status:** Open — Solution to be defined  

---

## 1. Context

A journey builder allows non-technical business users (CST) to visually design applicant-facing onboarding journeys. A journey is a sequence of smart components connected on a canvas. Each smart component represents a step in the applicant's journey — such as document upload, identity verification, income assessment, and so on.

Smart components are state-based on the backend. Each component has defined states and transition actions that govern how the component moves from one state to another.

---

## 2. The Core Problem

Some smart components perform operations that are **not instant**. The operation is triggered when the applicant completes a step — but the result may take seconds, minutes, or even longer to arrive. These are **asynchronous operations**.

Examples of async operations across different smart component types:
- Document OCR and analysis after a file is uploaded
- Credit bureau report generation after applicant data is submitted
- Video KYC session outcome after the session is conducted
- Background verification after applicant details are submitted

In these cases, the journey cannot simply move forward as if the operation is complete. The result of the async operation is often critical for subsequent steps in the journey to function correctly.

---

## 3. The Two Modes of Experience

Business users need the ability to choose between two applicant experiences when a smart component has an async operation:

**Mode 1 — Synchronous Experience:**  
The applicant waits at the smart component's step until the async operation resolves. The journey does not advance until there is a result. If the result is a failure, the applicant retries at the same step. If retries are exhausted, the journey terminates.

**Mode 2 — Asynchronous Experience:**  
The applicant moves forward in the journey immediately after triggering the operation, without waiting for a result. The operation runs in the background. At a certain point later in the journey — before a step that requires the result — the journey must check the status of the async operation and act accordingly.

---

## 4. The Unsolved Problem — Async Mode Specifically

In synchronous mode, the problem is relatively straightforward — the journey holds the applicant at the same step until the operation resolves.

**In asynchronous mode, the following problems are unsolved:**

### 4.1 When and Where to Check the Status

The journey must check the async operation's status at some point before a critical downstream step. The question is: **where in the journey does this check happen, and how is it configured?**

- The check cannot happen too early — it would disrupt the applicant's flow unnecessarily
- The check cannot happen too late — a downstream step may execute without the required result being available
- The business user configuring the journey needs to define the check point — but at the time of configuring the async component, the downstream steps may not yet exist on the canvas

### 4.2 What to Do at the Check Point — Three Possible States

When the journey checks the async operation's status, there are at least three possible outcomes. The exact status values and their names differ between different smart components. But broadly:

1. **Operation still in progress** — the result is not yet available. The journey must wait.
2. **Operation succeeded** — the result is available and positive. The journey should proceed.
3. **Operation failed** — the result indicates a failure. The applicant needs to take corrective action.

The journey builder must handle all three outcomes. The challenge is:
- **How are these outcomes configured?** Different smart components have different status terminologies, different numbers of possible states, and different meanings for each state.
- A generic mechanism is needed that works for any smart component — not a solution hardcoded to specific status values.

### 4.3 Handling Failure Without Rewinding the Journey

When the async operation fails at the check point, the applicant needs to retry. However:
- The applicant has already moved forward and completed several steps after the async component
- **Sending the applicant back to the original step is not acceptable** — they would be forced to redo all completed steps in between
- The corrective action (re-submission, re-upload, re-attempt) must happen at the check point itself, without the applicant losing their progress

How this corrective action is presented to the applicant and how it is configured is unsolved.

### 4.4 Retry Limits and Terminal Failure

Retries cannot be unlimited. There must be a maximum number of attempts after which the journey terminates. The questions are:
- How is the retry limit configured and where does it live?
- Does the retry counter span across the original attempt and all subsequent retries at the check point, or does each have its own counter?
- When retries are exhausted, what happens? Where does the journey go?

### 4.5 Configuration Ownership — Which Block Owns What

A journey may have multiple async smart components. Multiple check points may exist across the journey. The problem of configuration ownership is:
- Does the async smart component own the configuration of when and where to check its status?
- Does the check point block (if one exists) own the configuration of what to do for each status?
- Does the journey engine handle this automatically based on declared component states?
- Or is this a combination — and if so, what does each party own?

This is unsolved and directly affects how CST configures the journey.

### 4.6 Notification to Applicant During Async Wait

When the applicant has moved forward and the operation is running in the background:
- The applicant may close their browser or be inactive for an extended period
- The result (success or failure) may arrive at any time
- The applicant needs to be notified of the result so they can return and continue or take corrective action
- How this notification is configured, what it contains, and when it fires is part of the unsolved configuration problem

### 4.7 Genericity — Not Specific to Any One Smart Component

The solution to all of the above must work generically for any smart component that has async behavior — now and in the future. A solution that is designed specifically for one component type is not acceptable. The journey builder will have many such components.

---

## 5. Summary of Open Questions

1. Where in the journey is the async status check configured, and by whom?
2. How does the configuration handle the fact that downstream steps may not exist at the time the async component is configured?
3. How are the possible status outcomes of an async operation declared and mapped to journey actions — in a way that is generic across all component types?
4. How does the journey handle failure at the check point without rewinding the applicant through completed steps?
5. How is the retry limit tracked and enforced across all attempts?
6. When retries are exhausted, how does the journey terminate and where does the configuration for this live?
7. What is the applicant notification mechanism during async wait, and how is it configured?
8. Who owns what configuration — the async component, the check point, or the journey engine?

---

## 6. Constraints

- The solution must be operable by non-technical business users (CST) — no developer jargon, no code, no complex mapping interfaces
- The solution must be generic — it cannot be designed only for one smart component type
- The applicant journey must always move forward — no rewinding through completed steps
- The journey canvas must remain clean and comprehensible to the CST user building it
- The backend is state-based — smart components already have defined states and transition actions
