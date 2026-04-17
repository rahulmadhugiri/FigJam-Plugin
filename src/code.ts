/// <reference types="@figma/plugin-typings" />

// ─── Serialized board shape ───────────────────────────────────────────────────

interface SerializedNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  characters?: string;
  fillColor?: SerializedColor;
  textColor?: SerializedColor;
  children?: SerializedNode[];
}

interface SerializedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RepeatedGridIntent {
  kind: 'repeated-grid';
  targetCount?: number;
  addCount?: number;
  names?: string[];
  groupIds?: string[][];
  groupCount?: number;
}

interface OrderedSwapIntent {
  kind: 'ordered-swap';
  firstIndex: number;
  secondIndex: number;
  groupIds?: string[][];
}

interface RepeatedGridColumn {
  centerX: number;
  nodes: SceneNode[];
}

interface RepeatedGridGroup {
  columns: RepeatedGridColumn[];
  stepX: number;
}

type LayoutIntent = RepeatedGridIntent | OrderedSwapIntent;

// ─── Action schema ────────────────────────────────────────────────────────────

// Text
interface UpdateTextAction          { action: 'update_text';          target: string; value: string }
interface SetFontSizeAction         { action: 'set_font_size';         target: string; size: number }
interface SetFontColorAction        { action: 'set_font_color';        target: string; r: number; g: number; b: number; a?: number }
interface SetTextAlignAction        { action: 'set_text_align';        target: string; horizontal?: 'LEFT'|'CENTER'|'RIGHT'|'JUSTIFIED'; vertical?: 'TOP'|'CENTER'|'BOTTOM' }
interface SetTextDecorationAction   { action: 'set_text_decoration';   target: string; decoration: 'NONE'|'UNDERLINE'|'STRIKETHROUGH' }
interface SetTextCaseAction         { action: 'set_text_case';         target: string; textCase: 'ORIGINAL'|'UPPER'|'LOWER'|'TITLE' }

// Position & size
interface MoveNodeAction            { action: 'move_node';             target: string; x?: number; y?: number }
interface MoveNodesDownAction       { action: 'move_nodes_down';       target_group: string[]; distance: number }
interface ResizeNodeAction          { action: 'resize_node';           target: string; width: number; height: number }
interface RotateNodeAction          { action: 'rotate_node';           target: string; rotation: number }

// Visual
interface SetFillColorAction        { action: 'set_fill_color';        target: string; r: number; g: number; b: number; a?: number }
interface SetStrokeAction           { action: 'set_stroke';            target: string; r: number; g: number; b: number; a?: number; weight?: number }
interface SetOpacityAction          { action: 'set_opacity';           target: string; opacity: number }
interface SetCornerRadiusAction     { action: 'set_corner_radius';     target: string; radius: number }
interface SetVisibleAction          { action: 'set_visible';           target: string; visible: boolean }
interface SetBlendModeAction        { action: 'set_blend_mode';        target: string; blendMode: string }

// Node management
interface LockNodesAction           { action: 'lock_nodes';            node_ids: string[] }
interface UnlockNodesAction         { action: 'unlock_nodes';          node_ids: string[] }
interface RenameNodeAction          { action: 'rename_node';           target: string; name: string }
interface DeleteNodesAction         { action: 'delete_nodes';          node_ids: string[] }
interface DuplicateNodeAction       { action: 'duplicate_node';        source_id: string; offset_x?: number; offset_y?: number }
interface GroupNodesAction          { action: 'group_nodes';           node_ids: string[]; name?: string }
interface UngroupNodeAction         { action: 'ungroup_node';          target: string }
interface MoveToFrontAction         { action: 'move_to_front';         target: string }
interface MoveToBackAction          { action: 'move_to_back';          target: string }

// Creation
interface InsertNewStickyAction     { action: 'insert_new_sticky';     text: string; position: { x: number; y: number } | { after: string }; parent_id?: string }
interface InsertFrameAction         { action: 'insert_frame';          x: number; y: number; width: number; height: number; name?: string; parent_id?: string }
interface InsertTextAction          { action: 'insert_text';           x: number; y: number; text: string; parent_id?: string }
interface InsertSectionAction       { action: 'insert_section';        x: number; y: number; width: number; height: number; name?: string }
interface InsertRectangleAction     { action: 'insert_rectangle';      x: number; y: number; width: number; height: number; parent_id?: string }
interface InsertEllipseAction       { action: 'insert_ellipse';        x: number; y: number; width: number; height: number; parent_id?: string }

// FigJam specific
interface SetStickyColorAction      { action: 'set_sticky_color';      target: string; r: number; g: number; b: number }
interface SetSectionHiddenAction    { action: 'set_section_hidden';    target: string; hidden: boolean }
interface RepositionSectionAction   { action: 'reposition_section';    section_id: string; new_x: number; new_y: number }
interface DuplicateSectionAction    { action: 'duplicate_section';     source_id: string; new_parent_id?: string; offset_x?: number; offset_y?: number }

// Viewport
interface ScrollIntoViewAction      { action: 'scroll_into_view';      node_ids: string[] }

type BoardAction =
  | UpdateTextAction | SetFontSizeAction | SetFontColorAction | SetTextAlignAction
  | SetTextDecorationAction | SetTextCaseAction
  | MoveNodeAction | MoveNodesDownAction | ResizeNodeAction | RotateNodeAction
  | SetFillColorAction | SetStrokeAction | SetOpacityAction | SetCornerRadiusAction
  | SetVisibleAction | SetBlendModeAction
  | LockNodesAction | UnlockNodesAction | RenameNodeAction | DeleteNodesAction
  | DuplicateNodeAction | GroupNodesAction | UngroupNodeAction
  | MoveToFrontAction | MoveToBackAction
  | InsertNewStickyAction | InsertFrameAction | InsertTextAction
  | InsertSectionAction | InsertRectangleAction | InsertEllipseAction
  | SetStickyColorAction | SetSectionHiddenAction
  | RepositionSectionAction | DuplicateSectionAction
  | ScrollIntoViewAction;

const KNOWN_ACTIONS = new Set([
  'update_text','set_font_size','set_font_color','set_text_align','set_text_decoration','set_text_case',
  'move_node','move_nodes_down','resize_node','rotate_node',
  'set_fill_color','set_stroke','set_opacity','set_corner_radius','set_visible','set_blend_mode',
  'lock_nodes','unlock_nodes','rename_node','delete_nodes','duplicate_node',
  'group_nodes','ungroup_node','move_to_front','move_to_back',
  'insert_new_sticky','insert_frame','insert_text','insert_section','insert_rectangle','insert_ellipse',
  'set_sticky_color','set_section_hidden','reposition_section','duplicate_section',
  'scroll_into_view',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function solidPaint(r: number, g: number, b: number, a = 1): SolidPaint {
  return { type: 'SOLID', color: { r, g, b }, opacity: a };
}

function getNodeBounds(node: SceneNode): Bounds | null {
  if (!('x' in node) || !('y' in node) || !('width' in node) || !('height' in node)) return null;
  const positioned = node as SceneNode & Bounds;
  return {
    x: positioned.x,
    y: positioned.y,
    width: positioned.width,
    height: positioned.height,
  };
}

function combineBounds(nodes: readonly SceneNode[]): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  for (const node of nodes) {
    const bounds = getNodeBounds(node);
    if (!bounds) continue;
    found = true;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  if (!found) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function expandBounds(bounds: Bounds, padding: number): Bounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + (padding * 2),
    height: bounds.height + (padding * 2),
  };
}

function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function serializeSolidPaint(paints: ReadonlyArray<Paint> | typeof figma.mixed | undefined): SerializedColor | undefined {
  if (!paints || paints === figma.mixed || !Array.isArray(paints)) return undefined;
  const solid = paints.find((paint): paint is SolidPaint => paint.type === 'SOLID');
  if (!solid) return undefined;
  return {
    r: solid.color.r,
    g: solid.color.g,
    b: solid.color.b,
    a: solid.opacity ?? 1,
  };
}

async function getTextNode(id: string, errors: string[]): Promise<TextNode | null> {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) { errors.push(`node ${id} not found`); return null; }
  if (node.type === 'STICKY')           return (node as StickyNode).text as unknown as TextNode;
  if (node.type === 'SHAPE_WITH_TEXT')  return (node as ShapeWithTextNode).text as unknown as TextNode;
  if (node.type === 'TEXT')             return node as TextNode;
  errors.push(`node ${id} (${node.type}) has no text`);
  return null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function expandNodeBounds(node: SceneNode, padding: number): Bounds | null {
  const bounds = getNodeBounds(node);
  return bounds ? expandBounds(bounds, padding) : null;
}

function isRepeatedGridCandidate(node: SceneNode): boolean {
  return node.type === 'STICKY' || node.type === 'SHAPE_WITH_TEXT';
}

function collectRepeatedGridCandidates(): SceneNode[] {
  const seen = new Set<string>();
  const nodes: SceneNode[] = [];

  function visit(node: SceneNode): void {
    if (seen.has(node.id)) return;
    seen.add(node.id);

    if (isRepeatedGridCandidate(node) && getNodeBounds(node)) {
      nodes.push(node);
    }

    if ('children' in node) {
      for (const child of node.children as readonly SceneNode[]) {
        visit(child);
      }
    }
  }

  for (const node of figma.currentPage.selection) {
    visit(node);
  }

  return nodes;
}

function getConnectedNodeGroups(nodes: SceneNode[], padding: number): SceneNode[][] {
  const groups: SceneNode[][] = [];
  const visited = new Set<string>();

  for (const start of nodes) {
    if (visited.has(start.id)) continue;

    const queue: SceneNode[] = [start];
    const group: SceneNode[] = [];
    visited.add(start.id);

    while (queue.length > 0) {
      const current = queue.shift() as SceneNode;
      group.push(current);
      const currentBounds = expandNodeBounds(current, padding);
      if (!currentBounds) continue;

      for (const candidate of nodes) {
        if (visited.has(candidate.id)) continue;
        const candidateBounds = expandNodeBounds(candidate, padding);
        if (!candidateBounds) continue;
        if (!boundsIntersect(currentBounds, candidateBounds)) continue;
        visited.add(candidate.id);
        queue.push(candidate);
      }
    }

    groups.push(group);
  }

  return groups;
}

function getConnectedRepeatedGroups(nodes: SceneNode[]): SceneNode[][] {
  return getConnectedNodeGroups(nodes, 72);
}

function sortNodeGroupsByReadingOrder(groups: SceneNode[][]): SceneNode[][] {
  return [...groups].sort((a, b) => {
    const boundsA = combineBounds(a);
    const boundsB = combineBounds(b);
    if (!boundsA || !boundsB) return 0;
    const rowTolerance = Math.max(24, Math.min(boundsA.height, boundsB.height) * 0.45);
    if (Math.abs(boundsA.y - boundsB.y) <= rowTolerance) return boundsA.x - boundsB.x;
    return boundsA.y - boundsB.y;
  });
}

function analyzeRepeatedGridGroup(nodes: SceneNode[]): RepeatedGridGroup | null {
  if (nodes.length < 4) return null;

  const positioned = nodes
    .map((node) => {
      const bounds = getNodeBounds(node);
      return bounds ? { node, bounds } : null;
    })
    .filter((entry): entry is { node: SceneNode; bounds: Bounds } => entry !== null)
    .sort((a, b) => a.bounds.x - b.bounds.x);

  if (positioned.length < 4) return null;

  const medianWidth = median(positioned.map((entry) => entry.bounds.width));
  const tolerance = Math.max(24, medianWidth * 0.55);
  const columns: RepeatedGridColumn[] = [];

  for (const entry of positioned) {
    const target = columns.find((column) => Math.abs(column.centerX - entry.bounds.x) <= tolerance);
    if (target) {
      target.nodes.push(entry.node);
      target.centerX = target.nodes.reduce((sum, node) => sum + ((getNodeBounds(node)?.x) ?? 0), 0) / target.nodes.length;
    } else {
      columns.push({ centerX: entry.bounds.x, nodes: [entry.node] });
    }
  }

  const usableColumns = columns
    .map((column) => ({
      centerX: column.centerX,
      nodes: [...column.nodes].sort((a, b) => ((getNodeBounds(a)?.y) ?? 0) - ((getNodeBounds(b)?.y) ?? 0)),
    }))
    .filter((column) => column.nodes.length >= 2)
    .sort((a, b) => a.centerX - b.centerX);

  if (usableColumns.length < 2) return null;

  const stepCandidates: number[] = [];
  for (let i = 1; i < usableColumns.length; i += 1) {
    stepCandidates.push(usableColumns[i].centerX - usableColumns[i - 1].centerX);
  }

  const stepX = stepCandidates.length > 0
    ? median(stepCandidates)
    : Math.max(80, medianWidth + 24);

  if (stepX < 30) return null;
  return { columns: usableColumns, stepX };
}

async function setTextOnSceneNode(node: SceneNode, value: string, errors: string[]): Promise<boolean> {
  try {
    if (node.type === 'STICKY') {
      await figma.loadFontAsync(node.text.fontName as FontName);
      node.text.characters = value;
      return true;
    }
    if (node.type === 'SHAPE_WITH_TEXT') {
      await figma.loadFontAsync(node.text.fontName as FontName);
      node.text.characters = value;
      return true;
    }
    if (node.type === 'TEXT') {
      await figma.loadFontAsync(node.fontName as FontName);
      node.characters = value;
      return true;
    }
    errors.push(`Cannot set text on ${node.type} node ${node.id}`);
  } catch (e) {
    errors.push(`set_text_on_node: ${String(e)}`);
  }
  return false;
}

// ─── Node serialization ───────────────────────────────────────────────────────

function serializeNode(node: SceneNode, depth = 0): SerializedNode | null {
  if (depth > 4) return null;

  const base: SerializedNode = {
    id: node.id,
    type: node.type,
    name: node.name,
    x: 'x' in node ? (node as SceneNode & { x: number }).x : 0,
    y: 'y' in node ? (node as SceneNode & { y: number }).y : 0,
    width: 'width' in node ? (node as SceneNode & { width: number }).width : 0,
    height: 'height' in node ? (node as SceneNode & { height: number }).height : 0,
    locked: 'locked' in node ? (node as SceneNode & { locked: boolean }).locked : false,
    visible: 'visible' in node ? (node as SceneNode & { visible: boolean }).visible : true,
    opacity: 'opacity' in node ? (node as SceneNode & { opacity: number }).opacity : 1,
  };

  if ('fills' in node) {
    base.fillColor = serializeSolidPaint((node as SceneNode & { fills: ReadonlyArray<Paint> | typeof figma.mixed }).fills);
  }

  if (node.type === 'STICKY') {
    base.characters = (node as StickyNode).text.characters;
    base.textColor = serializeSolidPaint((node as StickyNode).text.fills);
  } else if (node.type === 'TEXT') {
    base.characters = (node as TextNode).characters;
    base.textColor = serializeSolidPaint((node as TextNode).fills);
  } else if (node.type === 'SHAPE_WITH_TEXT') {
    base.characters = (node as ShapeWithTextNode).text.characters;
    base.textColor = serializeSolidPaint((node as ShapeWithTextNode).text.fills);
  }

  const containerTypes = new Set(['FRAME','GROUP','SECTION','COMPONENT','INSTANCE']);
  if ('children' in node && containerTypes.has(node.type)) {
    const children = (node.children as readonly SceneNode[])
      .map((child) => { try { return serializeNode(child, depth + 1); } catch { return null; } })
      .filter((n): n is SerializedNode => n !== null);
    if (children.length > 0) base.children = children;
  }

  return base;
}

function getBoardSnapshot(): SerializedNode[] {
  const safe = (n: SceneNode) => { try { return serializeNode(n); } catch { return null; } };
  const pageChildren = figma.currentPage.children as readonly SceneNode[];
  const sel = figma.currentPage.selection;

  if (sel.length === 0) {
    return pageChildren
      .slice(0, 100).map(safe).filter((n): n is SerializedNode => n !== null);
  }

  const selectionBounds = combineBounds(sel);
  if (!selectionBounds) {
    return pageChildren
      .slice(0, 100).map(safe).filter((n): n is SerializedNode => n !== null);
  }

  const nearbyBounds = expandBounds(selectionBounds, 320);
  const nearbyChildren = pageChildren.filter((node) => {
    const bounds = getNodeBounds(node);
    return bounds ? boundsIntersect(bounds, nearbyBounds) : false;
  });

  const contextNodes = nearbyChildren.length > 0 ? nearbyChildren : pageChildren;
  return contextNodes
    .slice(0, 100).map(safe).filter((n): n is SerializedNode => n !== null);
}

// ─── Action dispatchers ───────────────────────────────────────────────────────

async function applyUpdateText(a: UpdateTextAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node) { errors.push(`update_text: node ${a.target} not found`); return; }
  try {
    if (node.type === 'STICKY') {
      const s = node as StickyNode;
      if (s.locked) { errors.push(`update_text: node ${a.target} is locked`); return; }
      await figma.loadFontAsync(s.text.fontName as FontName);
      s.text.characters = a.value;
    } else if (node.type === 'TEXT') {
      const t = node as TextNode;
      if (t.locked) { errors.push(`update_text: node ${a.target} is locked`); return; }
      await figma.loadFontAsync(t.fontName as FontName);
      t.characters = a.value;
    } else if (node.type === 'SHAPE_WITH_TEXT') {
      const s = node as ShapeWithTextNode;
      if (s.locked) { errors.push(`update_text: node ${a.target} is locked`); return; }
      await figma.loadFontAsync(s.text.fontName as FontName);
      s.text.characters = a.value;
    } else {
      errors.push(`update_text: node ${a.target} (${node.type}) has no text`);
    }
  } catch (e) { errors.push(`update_text: ${String(e)}`); }
}

async function applySetFontSize(a: SetFontSizeAction, errors: string[]): Promise<void> {
  const tn = await getTextNode(a.target, errors);
  if (!tn) return;
  try {
    await figma.loadFontAsync(tn.fontName as FontName);
    tn.fontSize = a.size;
  } catch (e) { errors.push(`set_font_size: ${String(e)}`); }
}

async function applySetFontColor(a: SetFontColorAction, errors: string[]): Promise<void> {
  const tn = await getTextNode(a.target, errors);
  if (!tn) return;
  try {
    await figma.loadFontAsync(tn.fontName as FontName);
    tn.fills = [solidPaint(a.r, a.g, a.b, a.a ?? 1)];
  } catch (e) { errors.push(`set_font_color: ${String(e)}`); }
}

async function applySetTextAlign(a: SetTextAlignAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node || node.type !== 'TEXT') { errors.push(`set_text_align: TEXT node ${a.target} not found`); return; }
  const t = node as TextNode;
  try {
    await figma.loadFontAsync(t.fontName as FontName);
    if (a.horizontal) t.textAlignHorizontal = a.horizontal;
    if (a.vertical)   t.textAlignVertical   = a.vertical;
  } catch (e) { errors.push(`set_text_align: ${String(e)}`); }
}

async function applySetTextDecoration(a: SetTextDecorationAction, errors: string[]): Promise<void> {
  const tn = await getTextNode(a.target, errors);
  if (!tn) return;
  try {
    await figma.loadFontAsync(tn.fontName as FontName);
    tn.textDecoration = a.decoration;
  } catch (e) { errors.push(`set_text_decoration: ${String(e)}`); }
}

async function applySetTextCase(a: SetTextCaseAction, errors: string[]): Promise<void> {
  const tn = await getTextNode(a.target, errors);
  if (!tn) return;
  try {
    await figma.loadFontAsync(tn.fontName as FontName);
    tn.textCase = a.textCase;
  } catch (e) { errors.push(`set_text_case: ${String(e)}`); }
}

async function applyMoveNode(a: MoveNodeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { x: number; y: number } | null;
  if (!node) { errors.push(`move_node: node ${a.target} not found`); return; }
  if (a.x !== undefined) node.x = a.x;
  if (a.y !== undefined) node.y = a.y;
}

async function applyMoveNodesDown(a: MoveNodesDownAction, errors: string[]): Promise<void> {
  for (const id of a.target_group) {
    const node = await figma.getNodeByIdAsync(id) as SceneNode & { y: number } | null;
    if (!node) { errors.push(`move_nodes_down: node ${id} not found`); continue; }
    node.y += a.distance;
  }
}

async function applyResizeNode(a: ResizeNodeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node) { errors.push(`resize_node: node ${a.target} not found`); return; }
  if ('resizeWithoutConstraints' in node) {
    (node as unknown as FrameNode).resizeWithoutConstraints(a.width, a.height);
  } else if ('resize' in node) {
    (node as unknown as RectangleNode).resize(a.width, a.height);
  }
}

async function applyRotateNode(a: RotateNodeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { rotation: number } | null;
  if (!node) { errors.push(`rotate_node: node ${a.target} not found`); return; }
  node.rotation = a.rotation;
}

async function applySetFillColor(a: SetFillColorAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { fills: Paint[] } | null;
  if (!node || !('fills' in node)) { errors.push(`set_fill_color: node ${a.target} not found or not fillable`); return; }
  node.fills = [solidPaint(a.r, a.g, a.b, a.a ?? 1)];
}

async function applySetStroke(a: SetStrokeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { strokes: Paint[]; strokeWeight: number } | null;
  if (!node) { errors.push(`set_stroke: node ${a.target} not found`); return; }
  if (!('strokes' in node)) {
    const sceneNode = node as SceneNode;
    errors.push(`set_stroke: ${sceneNode.type} node ${a.target} does not support strokes`);
    return;
  }
  node.strokes = [solidPaint(a.r, a.g, a.b, a.a ?? 1)];
  if (a.weight !== undefined) node.strokeWeight = a.weight;
}

async function applySetOpacity(a: SetOpacityAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { opacity: number } | null;
  if (!node) { errors.push(`set_opacity: node ${a.target} not found`); return; }
  node.opacity = Math.max(0, Math.min(1, a.opacity));
}

async function applySetCornerRadius(a: SetCornerRadiusAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node) { errors.push(`set_corner_radius: node ${a.target} not found`); return; }
  if (!('cornerRadius' in node)) {
    const sceneNode = node as SceneNode;
    errors.push(`set_corner_radius: ${sceneNode.type} node ${a.target} does not support corner radius`);
    return;
  }
  (node as unknown as { cornerRadius: number }).cornerRadius = a.radius;
}

async function applySetVisible(a: SetVisibleAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { visible: boolean } | null;
  if (!node) { errors.push(`set_visible: node ${a.target} not found`); return; }
  node.visible = a.visible;
}

async function applySetBlendMode(a: SetBlendModeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode & { blendMode: BlendMode } | null;
  if (!node || !('blendMode' in node)) { errors.push(`set_blend_mode: node ${a.target} not found`); return; }
  node.blendMode = a.blendMode as BlendMode;
}

async function applyLockNodes(a: LockNodesAction, errors: string[]): Promise<void> {
  for (const id of a.node_ids) {
    const node = await figma.getNodeByIdAsync(id) as SceneNode & { locked: boolean } | null;
    if (!node) { errors.push(`lock_nodes: node ${id} not found`); continue; }
    node.locked = true;
  }
}

async function applyUnlockNodes(a: UnlockNodesAction, errors: string[]): Promise<void> {
  for (const id of a.node_ids) {
    const node = await figma.getNodeByIdAsync(id) as SceneNode & { locked: boolean } | null;
    if (!node) { errors.push(`unlock_nodes: node ${id} not found`); continue; }
    node.locked = false;
  }
}

async function applyRenameNode(a: RenameNodeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node) { errors.push(`rename_node: node ${a.target} not found`); return; }
  node.name = a.name;
}

async function applyDeleteNodes(a: DeleteNodesAction, errors: string[]): Promise<void> {
  for (const id of a.node_ids) {
    const node = await figma.getNodeByIdAsync(id) as SceneNode | null;
    if (!node) { errors.push(`delete_nodes: node ${id} not found`); continue; }
    node.remove();
  }
}

async function applyDuplicateNode(a: DuplicateNodeAction, errors: string[]): Promise<SceneNode | null> {
  const node = await figma.getNodeByIdAsync(a.source_id) as SceneNode | null;
  if (!node || !('clone' in node)) { errors.push(`duplicate_node: node ${a.source_id} not found`); return null; }
  const clone = (node as SceneNode & { clone: () => SceneNode }).clone();
  if ('x' in clone) (clone as SceneNode & { x: number; y: number }).x += (a.offset_x ?? 20);
  if ('y' in clone) (clone as SceneNode & { x: number; y: number }).y += (a.offset_y ?? 20);
  return clone;
}

async function applyGroupNodes(a: GroupNodesAction, errors: string[]): Promise<void> {
  const nodes: SceneNode[] = [];
  for (const id of a.node_ids) {
    const n = await figma.getNodeByIdAsync(id) as SceneNode | null;
    if (n) nodes.push(n); else errors.push(`group_nodes: node ${id} not found`);
  }
  if (nodes.length < 2) { errors.push('group_nodes: need at least 2 nodes'); return; }
  const group = figma.group(nodes, figma.currentPage);
  if (a.name) group.name = a.name;
}

async function applyUngroupNode(a: UngroupNodeAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as GroupNode | null;
  if (!node || node.type !== 'GROUP') { errors.push(`ungroup_node: GROUP node ${a.target} not found`); return; }
  figma.ungroup(node);
}

async function applyMoveToFront(a: MoveToFrontAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode | null;
  if (!node || !node.parent) { errors.push(`move_to_front: node ${a.target} not found`); return; }
  (node.parent as ChildrenMixin).appendChild(node);
}

async function applyMoveToBack(a: MoveToBackAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target) as SceneNode | null;
  if (!node || !node.parent) { errors.push(`move_to_back: node ${a.target} not found`); return; }
  (node.parent as ChildrenMixin).insertChild(0, node);
}

async function applyInsertNewSticky(a: InsertNewStickyAction, errors: string[]): Promise<StickyNode | null> {
  try {
    const sticky = figma.createSticky();
    await figma.loadFontAsync(sticky.text.fontName as FontName);
    sticky.text.characters = a.text;
    if ('after' in a.position) {
      const ref = await figma.getNodeByIdAsync(a.position.after) as SceneNode & { x: number; y: number; height: number } | null;
      if (ref) { sticky.x = ref.x; sticky.y = ref.y + ref.height + 20; }
    } else {
      sticky.x = a.position.x; sticky.y = a.position.y;
    }
    if (a.parent_id) {
      const par = await figma.getNodeByIdAsync(a.parent_id);
      if (par && 'appendChild' in par) (par as ChildrenMixin).appendChild(sticky);
    }
    return sticky;
  } catch (e) { errors.push(`insert_new_sticky: ${String(e)}`); }
  return null;
}

async function applyInsertFrame(a: InsertFrameAction, errors: string[]): Promise<FrameNode | null> {
  try {
    const frame = figma.createFrame();
    frame.x = a.x; frame.y = a.y;
    frame.resizeWithoutConstraints(a.width, a.height);
    if (a.name) frame.name = a.name;
    if (a.parent_id) {
      const par = await figma.getNodeByIdAsync(a.parent_id);
      if (par && 'appendChild' in par) (par as ChildrenMixin).appendChild(frame);
    }
    return frame;
  } catch (e) { errors.push(`insert_frame: ${String(e)}`); }
  return null;
}

async function applyInsertText(a: InsertTextAction, errors: string[]): Promise<TextNode | null> {
  try {
    const t = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    t.characters = a.text;
    t.x = a.x; t.y = a.y;
    if (a.parent_id) {
      const par = await figma.getNodeByIdAsync(a.parent_id);
      if (par && 'appendChild' in par) (par as ChildrenMixin).appendChild(t);
    }
    return t;
  } catch (e) { errors.push(`insert_text: ${String(e)}`); }
  return null;
}

async function applyInsertSection(a: InsertSectionAction, errors: string[]): Promise<SectionNode | null> {
  try {
    const sec = figma.createSection();
    sec.x = a.x; sec.y = a.y;
    sec.resizeWithoutConstraints(a.width, a.height);
    if (a.name) sec.name = a.name;
    return sec;
  } catch (e) { errors.push(`insert_section: ${String(e)}`); }
  return null;
}

async function applyInsertRectangle(a: InsertRectangleAction, errors: string[]): Promise<RectangleNode | null> {
  try {
    const rect = figma.createRectangle();
    rect.x = a.x; rect.y = a.y;
    rect.resize(a.width, a.height);
    if (a.parent_id) {
      const par = await figma.getNodeByIdAsync(a.parent_id);
      if (par && 'appendChild' in par) (par as ChildrenMixin).appendChild(rect);
    }
    return rect;
  } catch (e) { errors.push(`insert_rectangle: ${String(e)}`); }
  return null;
}

async function applyInsertEllipse(a: InsertEllipseAction, errors: string[]): Promise<EllipseNode | null> {
  try {
    const el = figma.createEllipse();
    el.x = a.x; el.y = a.y;
    el.resize(a.width, a.height);
    if (a.parent_id) {
      const par = await figma.getNodeByIdAsync(a.parent_id);
      if (par && 'appendChild' in par) (par as ChildrenMixin).appendChild(el);
    }
    return el;
  } catch (e) { errors.push(`insert_ellipse: ${String(e)}`); }
  return null;
}

async function applySetStickyColor(a: SetStickyColorAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node || node.type !== 'STICKY') { errors.push(`set_sticky_color: STICKY node ${a.target} not found`); return; }
  (node as StickyNode).fills = [solidPaint(a.r, a.g, a.b)];
}

async function applySetSectionHidden(a: SetSectionHiddenAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.target);
  if (!node || node.type !== 'SECTION') { errors.push(`set_section_hidden: SECTION node ${a.target} not found`); return; }
  (node as SectionNode).sectionContentsHidden = a.hidden;
}

async function applyRepositionSection(a: RepositionSectionAction, errors: string[]): Promise<void> {
  const node = await figma.getNodeByIdAsync(a.section_id) as SceneNode & { x: number; y: number } | null;
  if (!node) { errors.push(`reposition_section: node ${a.section_id} not found`); return; }
  node.x = a.new_x; node.y = a.new_y;
}

async function applyDuplicateSection(a: DuplicateSectionAction, errors: string[]): Promise<SceneNode | null> {
  const node = await figma.getNodeByIdAsync(a.source_id) as SceneNode | null;
  if (!node || !('clone' in node)) { errors.push(`duplicate_section: node ${a.source_id} not found`); return null; }
  const clone = (node as SceneNode & { clone: () => SceneNode }).clone();
  if (a.new_parent_id) {
    const par = await figma.getNodeByIdAsync(a.new_parent_id);
    if (par && 'appendChild' in par) (par as ChildrenMixin).appendChild(clone);
  }
  if ('x' in clone) (clone as SceneNode & { x: number; y: number }).x += (a.offset_x ?? 80);
  if ('y' in clone) (clone as SceneNode & { x: number; y: number }).y += (a.offset_y ?? 80);
  return clone;
}

async function applyScrollIntoView(a: ScrollIntoViewAction, errors: string[]): Promise<void> {
  const nodes: SceneNode[] = [];
  for (const id of a.node_ids) {
    const n = await figma.getNodeByIdAsync(id) as SceneNode | null;
    if (n) nodes.push(n); else errors.push(`scroll_into_view: node ${id} not found`);
  }
  if (nodes.length > 0) figma.viewport.scrollAndZoomIntoView(nodes);
}

async function applyRepeatedGridIntent(intent: RepeatedGridIntent): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;
  const nodesToReveal: SceneNode[] = [];

  // ── Path A: whole-group duplication ─────────────────────────────────────
  // UI pre-computed spatial groups; each group = one "person slot" (NAME + grid)
  if (intent.groupIds && intent.groupIds.length >= 2) {
    const groups: Array<{ nodes: SceneNode[]; bounds: Bounds }> = [];
    for (const ids of intent.groupIds) {
      const nodes: SceneNode[] = [];
      for (const id of ids) {
        const n = await figma.getNodeByIdAsync(id) as SceneNode | null;
        if (n && !n.removed) nodes.push(n);
      }
      if (nodes.length === 0) continue;
      const bounds = combineBounds(nodes);
      if (bounds) groups.push({ nodes, bounds });
    }

    if (groups.length >= 2) {
      // Sort by reading order
      groups.sort((a, b) => {
        const rowTol = Math.max(24, Math.min(a.bounds.height, b.bounds.height) * 0.4);
        if (Math.abs(a.bounds.y - b.bounds.y) <= rowTol) return a.bounds.x - b.bounds.x;
        return a.bounds.y - b.bounds.y;
      });

      const existingCount = groups.length;
      const targetCount = Math.max(1, intent.targetCount ?? (existingCount + (intent.addCount ?? 0)));

      if (targetCount > existingCount) {
        // Detect groups per row
        const firstY = groups[0].bounds.y;
        const rowTol = Math.max(48, groups[0].bounds.height * 0.4);
        const groupsPerRow = Math.max(1, groups.filter(g => Math.abs(g.bounds.y - firstY) <= rowTol).length);

        // Detect row spacing
        let rowSpacing: number;
        if (existingCount > groupsPerRow) {
          rowSpacing = groups[groupsPerRow].bounds.y - groups[0].bounds.y;
        } else {
          rowSpacing = Math.max(...groups.map(g => g.bounds.height)) + 80;
        }

        // Use last complete row as template (fall back to first row)
        const lastRowStart = existingCount - (existingCount % groupsPerRow === 0 ? groupsPerRow : existingCount % groupsPerRow);
        const lastRow = groups.slice(lastRowStart);
        const templateRow = lastRow.length >= groupsPerRow ? lastRow : groups.slice(0, groupsPerRow);
        const lastRowBaseY = Math.min(...lastRow.map(g => g.bounds.y));
        const newRowBaseY = lastRowBaseY + rowSpacing;

        const toAdd = targetCount - existingCount;
        for (let i = 0; i < toAdd; i++) {
          const colIdx = i % groupsPerRow;
          const extraRow = Math.floor(i / groupsPerRow);
          const template = templateRow[colIdx % templateRow.length];
          const newGroupY = newRowBaseY + extraRow * rowSpacing;
          const dy = newGroupY - template.bounds.y;

          for (const node of template.nodes) {
            if (!('clone' in node)) { errors.push(`Cannot clone node ${node.id}`); continue; }
            const clone = (node as SceneNode & { clone: () => SceneNode }).clone();
            if ('y' in clone) (clone as SceneNode & { y: number }).y += dy;
            nodesToReveal.push(clone);
            count++;
          }
        }
      } else if (targetCount < existingCount) {
        for (const group of groups.slice(targetCount)) {
          for (const node of group.nodes) {
            if (!node.removed) { node.remove(); count++; }
          }
        }
      }

      if (nodesToReveal.length > 0) figma.viewport.scrollAndZoomIntoView(nodesToReveal);
      return { count, errors };
    }
  }

  // ── Path B: sticky-column fallback ──────────────────────────────────────
  const groups = getConnectedRepeatedGroups(collectRepeatedGridCandidates())
    .map(analyzeRepeatedGridGroup)
    .filter((group): group is RepeatedGridGroup => group !== null);

  if (groups.length === 0) {
    return { count: 0, errors: ['No repeated sticky grid found in the selection'] };
  }

  for (const group of groups) {
    const columns = [...group.columns];
    const existingCount = columns.length;
    const targetCount = Math.max(
      1,
      intent.targetCount ?? (existingCount + (intent.addCount ?? 0)),
    );

    if (targetCount < existingCount) {
      for (const column of columns.slice(targetCount)) {
        for (const node of column.nodes) {
          node.remove();
          count += 1;
        }
      }
      columns.splice(targetCount);
    }

    if (targetCount > existingCount) {
      const template = columns[columns.length - 1];
      for (let offsetIndex = 1; offsetIndex <= (targetCount - existingCount); offsetIndex += 1) {
        const clones: SceneNode[] = [];
        for (const sourceNode of template.nodes) {
          if (!('clone' in sourceNode)) {
            errors.push(`Cannot duplicate ${sourceNode.type} node ${sourceNode.id}`);
            continue;
          }
          const clone = (sourceNode as SceneNode & { clone: () => SceneNode }).clone();
          if ('x' in clone) (clone as SceneNode & { x: number; y: number }).x += group.stepX * offsetIndex;
          clones.push(clone);
          nodesToReveal.push(clone);
          count += 1;
        }
        const centerX = template.centerX + (group.stepX * offsetIndex);
        clones.sort((a, b) => ((getNodeBounds(a)?.y) ?? 0) - ((getNodeBounds(b)?.y) ?? 0));
        columns.push({ centerX, nodes: clones });
      }
    }

    if (intent.names && intent.names.length > 0) {
      const limit = Math.min(intent.names.length, columns.length);
      for (let i = 0; i < limit; i += 1) {
        const topNode = columns[i].nodes[0];
        if (!topNode) continue;
        if (await setTextOnSceneNode(topNode, intent.names[i], errors)) {
          count += 1;
        }
      }
    }
  }

  if (nodesToReveal.length > 0) {
    figma.viewport.scrollAndZoomIntoView(nodesToReveal);
  }

  return { count, errors };
}

async function applyOrderedSwapIntent(intent: OrderedSwapIntent): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];

  // Build groups: prefer pre-computed groupIds from UI, fall back to Figma selection clustering
  let groups: SceneNode[][];
  if (intent.groupIds && intent.groupIds.length >= Math.max(intent.firstIndex, intent.secondIndex)) {
    const resolved: SceneNode[][] = [];
    for (const ids of intent.groupIds) {
      const nodes: SceneNode[] = [];
      for (const id of ids) {
        const n = await figma.getNodeByIdAsync(id) as SceneNode | null;
        if (n && !n.removed) nodes.push(n);
      }
      if (nodes.length > 0) resolved.push(nodes);
    }
    groups = resolved;
  } else {
    const selected = [...figma.currentPage.selection].filter((node) => getNodeBounds(node) !== null);
    if (selected.length < 2) {
      return { count: 0, errors: ['Select at least two positioned nodes to swap groups'] };
    }
    groups = sortNodeGroupsByReadingOrder(getConnectedNodeGroups(selected, 36));
  }

  // Sort the final groups by reading order regardless of how they were obtained
  groups = sortNodeGroupsByReadingOrder(groups);
  const maxIndex = Math.max(intent.firstIndex, intent.secondIndex);
  if (groups.length < maxIndex) {
    return { count: 0, errors: ['Could not find enough spatial groups in the selection to swap those positions'] };
  }

  const firstGroup = groups[intent.firstIndex - 1];
  const secondGroup = groups[intent.secondIndex - 1];
  const firstBounds = combineBounds(firstGroup);
  const secondBounds = combineBounds(secondGroup);

  if (!firstBounds || !secondBounds) {
    return { count: 0, errors: ['Could not compute bounds for the selected groups'] };
  }

  const firstDx = secondBounds.x - firstBounds.x;
  const firstDy = secondBounds.y - firstBounds.y;
  const secondDx = firstBounds.x - secondBounds.x;
  const secondDy = firstBounds.y - secondBounds.y;

  let count = 0;
  for (const node of firstGroup) {
    if (!('x' in node) || !('y' in node)) {
      const sceneNode = node as SceneNode;
      errors.push(`Cannot move ${sceneNode.type} node ${sceneNode.id}`);
      continue;
    }
    const positioned = node as SceneNode & { x: number; y: number };
    positioned.x += firstDx;
    positioned.y += firstDy;
    count += 1;
  }

  for (const node of secondGroup) {
    if (!('x' in node) || !('y' in node)) {
      const sceneNode = node as SceneNode;
      errors.push(`Cannot move ${sceneNode.type} node ${sceneNode.id}`);
      continue;
    }
    const positioned = node as SceneNode & { x: number; y: number };
    positioned.x += secondDx;
    positioned.y += secondDy;
    count += 1;
  }

  figma.viewport.scrollAndZoomIntoView([...firstGroup, ...secondGroup]);
  return { count, errors };
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

async function applyActions(actions: BoardAction[]): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;
  const nodesToReveal: SceneNode[] = [];

  for (const a of actions) {
    if (!KNOWN_ACTIONS.has(a.action)) {
      errors.push(`Unknown action: ${(a as unknown as { action: string }).action}`);
      continue;
    }
    switch (a.action) {
      case 'update_text':          await applyUpdateText(a, errors); break;
      case 'set_font_size':        await applySetFontSize(a, errors); break;
      case 'set_font_color':       await applySetFontColor(a, errors); break;
      case 'set_text_align':       await applySetTextAlign(a, errors); break;
      case 'set_text_decoration':  await applySetTextDecoration(a, errors); break;
      case 'set_text_case':        await applySetTextCase(a, errors); break;
      case 'move_node':            await applyMoveNode(a, errors); break;
      case 'move_nodes_down':      await applyMoveNodesDown(a, errors); break;
      case 'resize_node':          await applyResizeNode(a, errors); break;
      case 'rotate_node':          await applyRotateNode(a, errors); break;
      case 'set_fill_color':       await applySetFillColor(a, errors); break;
      case 'set_stroke':           await applySetStroke(a, errors); break;
      case 'set_opacity':          await applySetOpacity(a, errors); break;
      case 'set_corner_radius':    await applySetCornerRadius(a, errors); break;
      case 'set_visible':          await applySetVisible(a, errors); break;
      case 'set_blend_mode':       await applySetBlendMode(a, errors); break;
      case 'lock_nodes':           await applyLockNodes(a, errors); break;
      case 'unlock_nodes':         await applyUnlockNodes(a, errors); break;
      case 'rename_node':          await applyRenameNode(a, errors); break;
      case 'delete_nodes':         await applyDeleteNodes(a, errors); break;
      case 'duplicate_node': {
        const clone = await applyDuplicateNode(a, errors);
        if (clone) nodesToReveal.push(clone);
        break;
      }
      case 'group_nodes':          await applyGroupNodes(a, errors); break;
      case 'ungroup_node':         await applyUngroupNode(a, errors); break;
      case 'move_to_front':        await applyMoveToFront(a, errors); break;
      case 'move_to_back':         await applyMoveToBack(a, errors); break;
      case 'insert_new_sticky': {
        const sticky = await applyInsertNewSticky(a, errors);
        if (sticky) nodesToReveal.push(sticky);
        break;
      }
      case 'insert_frame': {
        const frame = await applyInsertFrame(a, errors);
        if (frame) nodesToReveal.push(frame);
        break;
      }
      case 'insert_text': {
        const text = await applyInsertText(a, errors);
        if (text) nodesToReveal.push(text);
        break;
      }
      case 'insert_section': {
        const section = await applyInsertSection(a, errors);
        if (section) nodesToReveal.push(section);
        break;
      }
      case 'insert_rectangle': {
        const rect = await applyInsertRectangle(a, errors);
        if (rect) nodesToReveal.push(rect);
        break;
      }
      case 'insert_ellipse': {
        const ellipse = await applyInsertEllipse(a, errors);
        if (ellipse) nodesToReveal.push(ellipse);
        break;
      }
      case 'set_sticky_color':     await applySetStickyColor(a, errors); break;
      case 'set_section_hidden':   await applySetSectionHidden(a, errors); break;
      case 'reposition_section':   await applyRepositionSection(a, errors); break;
      case 'duplicate_section': {
        const sectionClone = await applyDuplicateSection(a, errors);
        if (sectionClone) nodesToReveal.push(sectionClone);
        break;
      }
      case 'scroll_into_view':     await applyScrollIntoView(a, errors); break;
    }
    count++;
  }

  if (nodesToReveal.length > 0) {
    figma.viewport.scrollAndZoomIntoView(nodesToReveal);
  }

  return { count, errors };
}

// ─── Plugin entry point ───────────────────────────────────────────────────────

figma.showUI(__html__, { width: 420, height: 560 });

function sendSelection(): void {
  try {
    const sel = figma.currentPage.selection;
    console.log('[FigJam AI] sendSelection — selection count:', sel.length, sel.map(n => n.type + ':' + n.id));
    const nodes = sel
      .map((n) => { try { return serializeNode(n); } catch (e) { console.error('[FigJam AI] serialize error', e); return null; } })
      .filter((n): n is SerializedNode => n !== null);
    const snap = getBoardSnapshot();
    console.log('[FigJam AI] boardSnapshot count:', snap.length);
    figma.ui.postMessage({ type: 'selection', nodes, boardSnapshot: snap, hasSelection: sel.length > 0 });
  } catch (err) {
    console.error('[FigJam AI] sendSelection error:', err);
  }
}

figma.on('selectionchange', sendSelection);

figma.ui.onmessage = async (msg: { type: string; actions?: unknown[]; key?: string; intent?: LayoutIntent }) => {
  try {
    if (msg.type === 'ready' || msg.type === 'request-selection') {
      sendSelection(); return;
    }
    if (msg.type === 'get-api-key') {
      const key = (await figma.clientStorage.getAsync('api-key')) ?? '';
      figma.ui.postMessage({ type: 'api-key', key }); return;
    }
    if (msg.type === 'save-api-key' && typeof msg.key === 'string') {
      await figma.clientStorage.setAsync('api-key', msg.key); return;
    }
    if (msg.type === 'apply-actions' && msg.actions) {
      const result = await applyActions(msg.actions as BoardAction[]);
      figma.ui.postMessage({ type: 'apply-complete', count: result.count, errors: result.errors });
      return;
    }
    if (msg.type === 'apply-layout-intent' && msg.intent) {
      const result = msg.intent.kind === 'ordered-swap'
        ? await applyOrderedSwapIntent(msg.intent)
        : await applyRepeatedGridIntent(msg.intent);
      figma.ui.postMessage({ type: 'apply-complete', count: result.count, errors: result.errors });
      return;
    }
    if (msg.type === 'close') figma.closePlugin();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[FigJam AI] onmessage error:', message);
    figma.ui.postMessage({ type: 'plugin-error', message });
  }
};
