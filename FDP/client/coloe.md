# Color System Guide - 4 Color Palette

## Our 4 Colors

### 1. BACKGROUND BLACK (#050505)
**CSS Variable:** `--background`
**Used For:**
- Page background
- Main body area
- Large empty spaces

**Example:**
```html
<!-- Entire page background -->
<main className="min-h-screen bg-background">
```

---

### 2. TEXT WHITE (#ffffff)
**CSS Variable:** `--foreground`
**Used For:**
- All main text
- Headings
- Body content
- Labels

**Example:**
```html
<!-- White text on dark background -->
<h1 className="text-foreground">AI Recruitment Workflow</h1>
<p className="text-foreground">Body text here</p>
```

---

### 3. PRIMARY BLUE (#3b82f6)
**CSS Variable:** `--primary`
**Used For:**
- Main action buttons
- Top border on cards
- Important icons
- Links and highlights
- Active states

**Examples:**

**Button:**
```html
<Button className="bg-primary text-primary-foreground">
  Execute Workflow
</Button>
```

**Card Top Border (attention):**
```html
<Card className="bg-card border-border">
  <div className="h-1 bg-primary"></div>
  <!-- Card content -->
</Card>
```

**Icon:**
```html
<Zap className="h-5 w-5 text-primary" />
```

**Text Highlight:**
```html
<p className="text-primary font-semibold">Important Message</p>
```

**Background for Icon Badge:**
```html
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
  <Mail className="h-5 w-5 text-primary" />
</div>
```

---

### 4. ACCENT EMERALD (#10b981)
**CSS Variable:** `--accent`
**Used For:**
- Success states
- Completion indicators
- Finished/Done badges
- Positive confirmations

**Examples:**

**Completed Step:**
```html
<!-- When task is done, use accent color -->
{isCompleted && (
  <CheckCircle2 className="h-6 w-6 text-accent" />
)}

<!-- Completed badge -->
<Badge className="bg-accent/15 border-accent/30 text-accent">
  Complete
</Badge>
```

**Success Message:**
```html
<div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
  <p className="text-accent font-medium">✓ Workflow completed</p>
</div>
```

**Percentage/Count (when success):**
```html
<div className="text-2xl font-bold text-accent">85%</div>
```

---

## Supporting Colors (Derived from Primary Colors)

### SECONDARY DARK (#2a2a2a)
**CSS Variable:** `--secondary`
**Used For:**
- Card backgrounds
- Input fields
- Hover states
- Subtle backgrounds

**Example:**
```html
<div className="bg-secondary rounded-lg p-4">
  <!-- Content with darker background -->
</div>
```

### BORDER GRAY (#333333)
**CSS Variable:** `--border`
**Used For:**
- Card borders
- Divider lines
- Subtle separators

**Example:**
```html
<Card className="bg-card border-border">
```

### MUTED GRAY (#9ca3af)
**CSS Variable:** `--muted-foreground`
**Used For:**
- Secondary text
- Helper text
- Disabled text
- Timestamps

**Example:**
```html
<p className="text-muted-foreground text-sm">
  Optional helper text or timestamp
</p>
```

---

## Color Application Pattern

### Light/Disabled State
Use opacity variations to show disabled or less important states:
```html
<!-- 10% opacity of primary -->
<div className="bg-primary/10 border border-primary/30"></div>

<!-- 20% opacity of accent -->
<div className="bg-accent/20"></div>
```

### Hover States
Slightly darken or add opacity on hover:
```html
<button className="bg-primary hover:bg-primary/90 transition-all">
  Button
</button>
```

---

## Complete Example: Card with All Colors

```html
<Card className="bg-card border-border">
  {/* Top border - BLUE (Primary) */}
  <div className="h-1 bg-primary"></div>
  
  <CardHeader>
    {/* Icon badge with BLUE background */}
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
      <Zap className="h-5 w-5 text-primary" />
    </div>
    
    {/* WHITE text heading */}
    <h2 className="text-foreground">Card Title</h2>
    
    {/* GRAY muted text for subtitle */}
    <p className="text-muted-foreground">Helper text</p>
  </CardHeader>
  
  <CardContent>
    {/* DARK background for content area */}
    <div className="bg-secondary rounded-lg p-4">
      {/* WHITE text on dark background */}
      <p className="text-foreground">Main content</p>
    </div>
    
    {/* Status: Use EMERALD for success */}
    {isComplete && (
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-4">
        <p className="text-accent">✓ Complete</p>
      </div>
    )}
  </CardContent>
</Card>
```

---

## Quick Reference Table

| Color | Hex | CSS Var | Use When |
|-------|-----|---------|----------|
| Black | #050505 | `--background` | Page/section background |
| White | #ffffff | `--foreground` | Main text, headings |
| Blue | #3b82f6 | `--primary` | Buttons, active states, icons, highlights |
| Emerald | #10b981 | `--accent` | Success, completion, done states |
| Dark Gray | #2a2a2a | `--secondary` | Card backgrounds, input areas |
| Border Gray | #333333 | `--border` | Dividers, card borders |
| Muted Gray | #9ca3af | `--muted-foreground` | Secondary text, disabled text |

---

## Color Usage Summary

✅ **DO:**
- Use BLUE for anything interactive (buttons, links)
- Use EMERALD for success/completion status
- Use WHITE for all readable text
- Use DARK GRAY for card/input backgrounds
- Use opacity levels (10%, 20%, 50%) for softer backgrounds

❌ **DON'T:**
- Don't use colors outside this palette
- Don't mix multiple colors in the same element
- Don't use WHITE text on LIGHT backgrounds
- Don't use EMERALD for non-success states
- Don't add extra gradient colors