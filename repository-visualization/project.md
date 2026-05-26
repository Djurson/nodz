# Repository Visualizer

## Overview

A tool for visualizing the structure and interconnections of code repositories as an interactive node graph. Files are represented as nodes and their relationships — such as function calls, class usage, and imports — are represented as edges between nodes. The graph updates in real time as changes are committed to the repository.

## Core Concept

When working in a large codebase it is often difficult to understand how files relate to each other, which files are central to the project, and how the structure evolves over time. This tool makes those relationships visible and explorable at a glance.

## Features

### Graph Visualization
- Each file in the repository is represented as a node
- Connections between nodes represent dependencies or relationships between files
- The graph is interactive — nodes can be moved, zoomed, and clicked for more detail
- Displayed in the browser as an HTML page

### Relationship Tracking
Edges between nodes are derived from actual code relationships, including:
- Import and require statements
- Function calls across files
- Class or type usage across files

### Live Updates
- The graph updates automatically when changes are committed to the repository
- Reflects the current state of the codebase at any point in time
- Git commit history can be used to replay how the graph evolved over time, making it possible to see how the architecture of a project changed across commits

## Relationship Depth

The tool is intended to support multiple levels of relationship granularity:

- **File level** — which files depend on which other files
- **Class / module level** — which classes or modules reference each other
- **Function level** — which functions call which other functions

## Use Cases

- Getting an overview of an unfamiliar codebase
- Identifying highly connected or central files (potential bottlenecks or core modules)
- Understanding the blast radius of changing a specific file
- Visualizing how a project's architecture grows and changes over time through its commit history
- Spotting circular dependencies or unexpected couplings between parts of the codebase
