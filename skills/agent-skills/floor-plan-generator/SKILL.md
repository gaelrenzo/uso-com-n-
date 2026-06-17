---
name: floor-plan-generator
description: Use when the user wants to generate, design, or layout a floor plan using AI constraint-satisfaction solver and room dimensions.
version: 1.0.0
author: Zuha Aqib & Antigravity
tags:
  - architecture
  - floor-plan
  - design
  - layout
  - ai
---

# Floor Plan Generator Using AI Skill

This skill allows the agent to generate AI-based floor plans based on room requirements, sizes, and architectural constraints. It uses a Constraint Satisfaction Problem (CSP) solver.

## When to Use
- When the user asks to generate a floor plan.
- When the user wants to layout rooms within a specific total area.
- When the user asks about architectural floor planning using AI.

## How to Use / Instructions
1. Parse the user's input for the floor plan request, which typically includes:
   - **Total Area** (e.g., 2000 sq ft)
   - **List of Rooms** and their desired sizes or quantities (e.g., Kitchen, Lounge Area, Garage, Balcony, Bedroom)
2. Run the CSP solver script: `python "C:/Users/renzo/Floor-Plan-Generator-Using-AI/src/final.py"`.
3. The solver will output valid layouts (order of rooms satisfying constraints like: no Kitchen next to Master Bedroom, etc.).
4. Format the output to present the generated layouts.
5. You can also offer to open the interactive Visualizer: `C:/Users/renzo/Floor-Plan-Generator-Using-AI/visualizer.html` in the user's browser, which provides a premium, interactive interface to generate and view floor plans.

## Output Format
Render the floor plan list and explain the constraints checked. Emphasize that they can run the graphical visualizer locally.

## Original Repository Reference
The core solver and logic of this skill is based on the following repository:
- **Repository URL:** [z-aqib/Floor-Plan-Generator-Using-AI](https://github.com/z-aqib/Floor-Plan-Generator-Using-AI)
- **Local Clone Path:** [Floor-Plan-Generator-Using-AI](file:///C:/Users/renzo/Floor-Plan-Generator-Using-AI)

