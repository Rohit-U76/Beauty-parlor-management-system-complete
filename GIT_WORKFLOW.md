# Seamless Git Collaboration & Merge Workflow

This guide guarantees that any feature or change you make can be pushed and merged by the repository owner/contributor **with zero conflicts and zero build errors**.

---

## 🌟 The 5 Rules for Conflict-Free Merging

1. **Never commit directly to `main`** — Keep your local `main` identical to `origin/main`.
2. **Branch per feature** — Always work in an isolated feature branch (e.g. `feature/billing-update`, `fix/appointment-time`).
3. **Rebase on `origin/main` before pushing** — Place your commits on top of the latest upstream commits.
4. **Run `npm run check` before committing** — Verifies TypeScript typing (`tsc --noEmit`) and Vite bundling (`npm run build`).
5. **Keep commits atomic and descriptive** — Follow conventional commits (`feat: ...`, `fix: ...`, `refactor: ...`).

---

## 🚀 Daily Workflow Step-by-Step

### Step 1: Update your local `main`
Before starting any new task, make sure you have the newest code:
```bash
git checkout main
git pull origin main
```

### Step 2: Create a new feature branch
Branch off from the freshly updated `main`:
```bash
git checkout -b feature/your-feature-name
```
*Examples:* `feature/loyalty-discount`, `fix/razorpay-error`, `feat/staff-schedule`

---

### Step 3: Make your code changes & test locally
Work on your code, run the development server:
```bash
npm run dev
```

Before committing, run the pre-check command:
```bash
npm run check
```
*(This checks TypeScript types and builds the app. If there are any errors, fix them first!)*

---

### Step 4: Commit your changes
Stage and commit cleanly:
```bash
git add <modified-files>
git commit -m "feat: describe the new feature clearly"
```

---

### Step 5: Sync with latest upstream before pushing (Crucial for Clean Merges!)
While you were working, other contributors might have pushed new commits to `main`. To ensure your changes merge without conflict:
```bash
# 1. Fetch latest changes from remote
git fetch origin

# 2. Rebase your feature branch on top of latest main
git rebase origin/main
```
> **Why `rebase`?**
> Rebase moves your new commits right to the tip of `main`. When the repository maintainer reviews your branch on GitHub, GitHub will say:
> **"Able to merge. These branches can be automatically merged."** with 0 conflicts!

*(If Git pauses with a conflict during rebase, open the file, resolve the conflict, run `git add <file>`, and then `git rebase --continue`.)*

---

### Step 6: Push your branch
Push your branch to GitHub:
```bash
git push -u origin feature/your-feature-name
```
*(If you have previously pushed this branch and rebased it, use `git push --force-with-lease origin feature/your-feature-name`)*

---

### Step 7: Open a Pull Request on GitHub
1. Go to the GitHub repository: [Rohit-U76/Bauty-parlour-management-system-2-work-](https://github.com/Rohit-U76/Bauty-parlour-management-system-2-work-)
2. You will see a button: **"Compare & pull request"**.
3. Target: `base: main` ← `compare: feature/your-feature-name`.
4. The contributor can merge your PR with 1 click (**Squash and merge** or **Rebase and merge**)!

---

## 🛠️ Helpful Quick Commands

| Task | Command |
| :--- | :--- |
| Check project health (types + build) | `npm run check` |
| View current branch & status | `git status` |
| View commit history graph | `git log --graph --oneline -n 10` |
| Discard uncommitted changes | `git restore .` |
| Switch back to main | `git checkout main` |

---

## 📌 Configured Safeguards in this Repo
- **`.gitattributes`**: Normalizes all line endings to `LF` automatically, preventing Windows (CRLF) vs Linux/Mac (LF) formatting conflicts.
- **`pull.rebase = true` & `rebase.autostash = true`**: Configured locally so pulling never creates messy merge bubble commits.
- **`.gitignore`**: Excludes `package-lock.json` (respecting `bun.lock`), Java `target/`, IDE folders (`.vscode`, `.idea`), OS files, and temp logs.
