"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const KNOWN_ACTIONS = new Set([
    'update_text', 'set_font_size', 'set_font_color', 'set_text_align', 'set_text_decoration', 'set_text_case',
    'move_node', 'move_nodes_down', 'resize_node', 'rotate_node',
    'set_fill_color', 'set_stroke', 'set_opacity', 'set_corner_radius', 'set_visible', 'set_blend_mode',
    'lock_nodes', 'unlock_nodes', 'rename_node', 'delete_nodes', 'duplicate_node',
    'group_nodes', 'ungroup_node', 'move_to_front', 'move_to_back',
    'insert_new_sticky', 'insert_frame', 'insert_text', 'insert_section', 'insert_rectangle', 'insert_ellipse',
    'set_sticky_color', 'set_section_hidden', 'reposition_section', 'duplicate_section',
    'scroll_into_view',
]);
// ─── Helpers ─────────────────────────────────────────────────────────────────
function solidPaint(r, g, b, a = 1) {
    return { type: 'SOLID', color: { r, g, b }, opacity: a };
}
function getNodeBounds(node) {
    if (!('x' in node) || !('y' in node) || !('width' in node) || !('height' in node))
        return null;
    const positioned = node;
    return {
        x: positioned.x,
        y: positioned.y,
        width: positioned.width,
        height: positioned.height,
    };
}
function combineBounds(nodes) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;
    for (const node of nodes) {
        const bounds = getNodeBounds(node);
        if (!bounds)
            continue;
        found = true;
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    }
    if (!found)
        return null;
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
function expandBounds(bounds, padding) {
    return {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + (padding * 2),
        height: bounds.height + (padding * 2),
    };
}
function boundsIntersect(a, b) {
    return (a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y);
}
function serializeSolidPaint(paints) {
    var _a;
    if (!paints || paints === figma.mixed || !Array.isArray(paints))
        return undefined;
    const solid = paints.find((paint) => paint.type === 'SOLID');
    if (!solid)
        return undefined;
    return {
        r: solid.color.r,
        g: solid.color.g,
        b: solid.color.b,
        a: (_a = solid.opacity) !== null && _a !== void 0 ? _a : 1,
    };
}
function getTextNode(id, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(id);
        if (!node) {
            errors.push(`node ${id} not found`);
            return null;
        }
        if (node.type === 'STICKY')
            return node.text;
        if (node.type === 'SHAPE_WITH_TEXT')
            return node.text;
        if (node.type === 'TEXT')
            return node;
        errors.push(`node ${id} (${node.type}) has no text`);
        return null;
    });
}
function median(values) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}
function expandNodeBounds(node, padding) {
    const bounds = getNodeBounds(node);
    return bounds ? expandBounds(bounds, padding) : null;
}
function isRepeatedGridCandidate(node) {
    return node.type === 'STICKY' || node.type === 'SHAPE_WITH_TEXT';
}
function collectRepeatedGridCandidates() {
    const seen = new Set();
    const nodes = [];
    function visit(node) {
        if (seen.has(node.id))
            return;
        seen.add(node.id);
        if (isRepeatedGridCandidate(node) && getNodeBounds(node)) {
            nodes.push(node);
        }
        if ('children' in node) {
            for (const child of node.children) {
                visit(child);
            }
        }
    }
    for (const node of figma.currentPage.selection) {
        visit(node);
    }
    return nodes;
}
function getConnectedNodeGroups(nodes, padding) {
    const groups = [];
    const visited = new Set();
    for (const start of nodes) {
        if (visited.has(start.id))
            continue;
        const queue = [start];
        const group = [];
        visited.add(start.id);
        while (queue.length > 0) {
            const current = queue.shift();
            group.push(current);
            const currentBounds = expandNodeBounds(current, padding);
            if (!currentBounds)
                continue;
            for (const candidate of nodes) {
                if (visited.has(candidate.id))
                    continue;
                const candidateBounds = expandNodeBounds(candidate, padding);
                if (!candidateBounds)
                    continue;
                if (!boundsIntersect(currentBounds, candidateBounds))
                    continue;
                visited.add(candidate.id);
                queue.push(candidate);
            }
        }
        groups.push(group);
    }
    return groups;
}
function getConnectedRepeatedGroups(nodes) {
    return getConnectedNodeGroups(nodes, 72);
}
function sortNodeGroupsByReadingOrder(groups) {
    return [...groups].sort((a, b) => {
        const boundsA = combineBounds(a);
        const boundsB = combineBounds(b);
        if (!boundsA || !boundsB)
            return 0;
        const rowTolerance = Math.max(24, Math.min(boundsA.height, boundsB.height) * 0.45);
        if (Math.abs(boundsA.y - boundsB.y) <= rowTolerance)
            return boundsA.x - boundsB.x;
        return boundsA.y - boundsB.y;
    });
}
function analyzeRepeatedGridGroup(nodes) {
    if (nodes.length < 4)
        return null;
    const positioned = nodes
        .map((node) => {
        const bounds = getNodeBounds(node);
        return bounds ? { node, bounds } : null;
    })
        .filter((entry) => entry !== null)
        .sort((a, b) => a.bounds.x - b.bounds.x);
    if (positioned.length < 4)
        return null;
    const medianWidth = median(positioned.map((entry) => entry.bounds.width));
    const tolerance = Math.max(24, medianWidth * 0.55);
    const columns = [];
    for (const entry of positioned) {
        const target = columns.find((column) => Math.abs(column.centerX - entry.bounds.x) <= tolerance);
        if (target) {
            target.nodes.push(entry.node);
            target.centerX = target.nodes.reduce((sum, node) => { var _a, _b; return sum + ((_b = ((_a = getNodeBounds(node)) === null || _a === void 0 ? void 0 : _a.x)) !== null && _b !== void 0 ? _b : 0); }, 0) / target.nodes.length;
        }
        else {
            columns.push({ centerX: entry.bounds.x, nodes: [entry.node] });
        }
    }
    const usableColumns = columns
        .map((column) => ({
        centerX: column.centerX,
        nodes: [...column.nodes].sort((a, b) => { var _a, _b, _c, _d; return ((_b = ((_a = getNodeBounds(a)) === null || _a === void 0 ? void 0 : _a.y)) !== null && _b !== void 0 ? _b : 0) - ((_d = ((_c = getNodeBounds(b)) === null || _c === void 0 ? void 0 : _c.y)) !== null && _d !== void 0 ? _d : 0); }),
    }))
        .filter((column) => column.nodes.length >= 2)
        .sort((a, b) => a.centerX - b.centerX);
    if (usableColumns.length < 2)
        return null;
    const stepCandidates = [];
    for (let i = 1; i < usableColumns.length; i += 1) {
        stepCandidates.push(usableColumns[i].centerX - usableColumns[i - 1].centerX);
    }
    const stepX = stepCandidates.length > 0
        ? median(stepCandidates)
        : Math.max(80, medianWidth + 24);
    if (stepX < 30)
        return null;
    return { columns: usableColumns, stepX };
}
function setTextOnSceneNode(node, value, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (node.type === 'STICKY') {
                yield figma.loadFontAsync(node.text.fontName);
                node.text.characters = value;
                return true;
            }
            if (node.type === 'SHAPE_WITH_TEXT') {
                yield figma.loadFontAsync(node.text.fontName);
                node.text.characters = value;
                return true;
            }
            if (node.type === 'TEXT') {
                yield figma.loadFontAsync(node.fontName);
                node.characters = value;
                return true;
            }
            errors.push(`Cannot set text on ${node.type} node ${node.id}`);
        }
        catch (e) {
            errors.push(`set_text_on_node: ${String(e)}`);
        }
        return false;
    });
}
// ─── Node serialization ───────────────────────────────────────────────────────
function serializeNode(node, depth = 0) {
    if (depth > 4)
        return null;
    const base = {
        id: node.id,
        type: node.type,
        name: node.name,
        x: 'x' in node ? node.x : 0,
        y: 'y' in node ? node.y : 0,
        width: 'width' in node ? node.width : 0,
        height: 'height' in node ? node.height : 0,
        locked: 'locked' in node ? node.locked : false,
        visible: 'visible' in node ? node.visible : true,
        opacity: 'opacity' in node ? node.opacity : 1,
    };
    if ('fills' in node) {
        base.fillColor = serializeSolidPaint(node.fills);
    }
    if (node.type === 'STICKY') {
        base.characters = node.text.characters;
        base.textColor = serializeSolidPaint(node.text.fills);
    }
    else if (node.type === 'TEXT') {
        base.characters = node.characters;
        base.textColor = serializeSolidPaint(node.fills);
    }
    else if (node.type === 'SHAPE_WITH_TEXT') {
        base.characters = node.text.characters;
        base.textColor = serializeSolidPaint(node.text.fills);
    }
    const containerTypes = new Set(['FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'INSTANCE']);
    if ('children' in node && containerTypes.has(node.type)) {
        const children = node.children
            .map((child) => { try {
            return serializeNode(child, depth + 1);
        }
        catch (_a) {
            return null;
        } })
            .filter((n) => n !== null);
        if (children.length > 0)
            base.children = children;
    }
    return base;
}
function getBoardSnapshot() {
    const safe = (n) => { try {
        return serializeNode(n);
    }
    catch (_a) {
        return null;
    } };
    const pageChildren = figma.currentPage.children;
    const sel = figma.currentPage.selection;
    if (sel.length === 0) {
        return pageChildren
            .slice(0, 100).map(safe).filter((n) => n !== null);
    }
    const selectionBounds = combineBounds(sel);
    if (!selectionBounds) {
        return pageChildren
            .slice(0, 100).map(safe).filter((n) => n !== null);
    }
    const nearbyBounds = expandBounds(selectionBounds, 320);
    const nearbyChildren = pageChildren.filter((node) => {
        const bounds = getNodeBounds(node);
        return bounds ? boundsIntersect(bounds, nearbyBounds) : false;
    });
    const contextNodes = nearbyChildren.length > 0 ? nearbyChildren : pageChildren;
    return contextNodes
        .slice(0, 100).map(safe).filter((n) => n !== null);
}
// ─── Action dispatchers ───────────────────────────────────────────────────────
function applyUpdateText(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`update_text: node ${a.target} not found`);
            return;
        }
        try {
            if (node.type === 'STICKY') {
                const s = node;
                if (s.locked) {
                    errors.push(`update_text: node ${a.target} is locked`);
                    return;
                }
                yield figma.loadFontAsync(s.text.fontName);
                s.text.characters = a.value;
            }
            else if (node.type === 'TEXT') {
                const t = node;
                if (t.locked) {
                    errors.push(`update_text: node ${a.target} is locked`);
                    return;
                }
                yield figma.loadFontAsync(t.fontName);
                t.characters = a.value;
            }
            else if (node.type === 'SHAPE_WITH_TEXT') {
                const s = node;
                if (s.locked) {
                    errors.push(`update_text: node ${a.target} is locked`);
                    return;
                }
                yield figma.loadFontAsync(s.text.fontName);
                s.text.characters = a.value;
            }
            else {
                errors.push(`update_text: node ${a.target} (${node.type}) has no text`);
            }
        }
        catch (e) {
            errors.push(`update_text: ${String(e)}`);
        }
    });
}
function applySetFontSize(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const tn = yield getTextNode(a.target, errors);
        if (!tn)
            return;
        try {
            yield figma.loadFontAsync(tn.fontName);
            tn.fontSize = a.size;
        }
        catch (e) {
            errors.push(`set_font_size: ${String(e)}`);
        }
    });
}
function applySetFontColor(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const tn = yield getTextNode(a.target, errors);
        if (!tn)
            return;
        try {
            yield figma.loadFontAsync(tn.fontName);
            tn.fills = [solidPaint(a.r, a.g, a.b, (_a = a.a) !== null && _a !== void 0 ? _a : 1)];
        }
        catch (e) {
            errors.push(`set_font_color: ${String(e)}`);
        }
    });
}
function applySetTextAlign(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || node.type !== 'TEXT') {
            errors.push(`set_text_align: TEXT node ${a.target} not found`);
            return;
        }
        const t = node;
        try {
            yield figma.loadFontAsync(t.fontName);
            if (a.horizontal)
                t.textAlignHorizontal = a.horizontal;
            if (a.vertical)
                t.textAlignVertical = a.vertical;
        }
        catch (e) {
            errors.push(`set_text_align: ${String(e)}`);
        }
    });
}
function applySetTextDecoration(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const tn = yield getTextNode(a.target, errors);
        if (!tn)
            return;
        try {
            yield figma.loadFontAsync(tn.fontName);
            tn.textDecoration = a.decoration;
        }
        catch (e) {
            errors.push(`set_text_decoration: ${String(e)}`);
        }
    });
}
function applySetTextCase(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const tn = yield getTextNode(a.target, errors);
        if (!tn)
            return;
        try {
            yield figma.loadFontAsync(tn.fontName);
            tn.textCase = a.textCase;
        }
        catch (e) {
            errors.push(`set_text_case: ${String(e)}`);
        }
    });
}
function applyMoveNode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`move_node: node ${a.target} not found`);
            return;
        }
        if (a.x !== undefined)
            node.x = a.x;
        if (a.y !== undefined)
            node.y = a.y;
    });
}
function applyMoveNodesDown(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const id of a.target_group) {
            const node = yield figma.getNodeByIdAsync(id);
            if (!node) {
                errors.push(`move_nodes_down: node ${id} not found`);
                continue;
            }
            node.y += a.distance;
        }
    });
}
function applyResizeNode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`resize_node: node ${a.target} not found`);
            return;
        }
        if ('resizeWithoutConstraints' in node) {
            node.resizeWithoutConstraints(a.width, a.height);
        }
        else if ('resize' in node) {
            node.resize(a.width, a.height);
        }
    });
}
function applyRotateNode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`rotate_node: node ${a.target} not found`);
            return;
        }
        node.rotation = a.rotation;
    });
}
function applySetFillColor(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || !('fills' in node)) {
            errors.push(`set_fill_color: node ${a.target} not found or not fillable`);
            return;
        }
        node.fills = [solidPaint(a.r, a.g, a.b, (_a = a.a) !== null && _a !== void 0 ? _a : 1)];
    });
}
function applySetStroke(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`set_stroke: node ${a.target} not found`);
            return;
        }
        if (!('strokes' in node)) {
            const sceneNode = node;
            errors.push(`set_stroke: ${sceneNode.type} node ${a.target} does not support strokes`);
            return;
        }
        node.strokes = [solidPaint(a.r, a.g, a.b, (_a = a.a) !== null && _a !== void 0 ? _a : 1)];
        if (a.weight !== undefined)
            node.strokeWeight = a.weight;
    });
}
function applySetOpacity(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`set_opacity: node ${a.target} not found`);
            return;
        }
        node.opacity = Math.max(0, Math.min(1, a.opacity));
    });
}
function applySetCornerRadius(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`set_corner_radius: node ${a.target} not found`);
            return;
        }
        if (!('cornerRadius' in node)) {
            const sceneNode = node;
            errors.push(`set_corner_radius: ${sceneNode.type} node ${a.target} does not support corner radius`);
            return;
        }
        node.cornerRadius = a.radius;
    });
}
function applySetVisible(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`set_visible: node ${a.target} not found`);
            return;
        }
        node.visible = a.visible;
    });
}
function applySetBlendMode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || !('blendMode' in node)) {
            errors.push(`set_blend_mode: node ${a.target} not found`);
            return;
        }
        node.blendMode = a.blendMode;
    });
}
function applyLockNodes(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const id of a.node_ids) {
            const node = yield figma.getNodeByIdAsync(id);
            if (!node) {
                errors.push(`lock_nodes: node ${id} not found`);
                continue;
            }
            node.locked = true;
        }
    });
}
function applyUnlockNodes(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const id of a.node_ids) {
            const node = yield figma.getNodeByIdAsync(id);
            if (!node) {
                errors.push(`unlock_nodes: node ${id} not found`);
                continue;
            }
            node.locked = false;
        }
    });
}
function applyRenameNode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node) {
            errors.push(`rename_node: node ${a.target} not found`);
            return;
        }
        node.name = a.name;
    });
}
function applyDeleteNodes(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const id of a.node_ids) {
            const node = yield figma.getNodeByIdAsync(id);
            if (!node) {
                errors.push(`delete_nodes: node ${id} not found`);
                continue;
            }
            node.remove();
        }
    });
}
function applyDuplicateNode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const node = yield figma.getNodeByIdAsync(a.source_id);
        if (!node || !('clone' in node)) {
            errors.push(`duplicate_node: node ${a.source_id} not found`);
            return null;
        }
        const clone = node.clone();
        if ('x' in clone)
            clone.x += ((_a = a.offset_x) !== null && _a !== void 0 ? _a : 20);
        if ('y' in clone)
            clone.y += ((_b = a.offset_y) !== null && _b !== void 0 ? _b : 20);
        return clone;
    });
}
function applyGroupNodes(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodes = [];
        for (const id of a.node_ids) {
            const n = yield figma.getNodeByIdAsync(id);
            if (n)
                nodes.push(n);
            else
                errors.push(`group_nodes: node ${id} not found`);
        }
        if (nodes.length < 2) {
            errors.push('group_nodes: need at least 2 nodes');
            return;
        }
        const group = figma.group(nodes, figma.currentPage);
        if (a.name)
            group.name = a.name;
    });
}
function applyUngroupNode(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || node.type !== 'GROUP') {
            errors.push(`ungroup_node: GROUP node ${a.target} not found`);
            return;
        }
        figma.ungroup(node);
    });
}
function applyMoveToFront(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || !node.parent) {
            errors.push(`move_to_front: node ${a.target} not found`);
            return;
        }
        node.parent.appendChild(node);
    });
}
function applyMoveToBack(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || !node.parent) {
            errors.push(`move_to_back: node ${a.target} not found`);
            return;
        }
        node.parent.insertChild(0, node);
    });
}
function applyInsertNewSticky(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sticky = figma.createSticky();
            yield figma.loadFontAsync(sticky.text.fontName);
            sticky.text.characters = a.text;
            if ('after' in a.position) {
                const ref = yield figma.getNodeByIdAsync(a.position.after);
                if (ref) {
                    sticky.x = ref.x;
                    sticky.y = ref.y + ref.height + 20;
                }
            }
            else {
                sticky.x = a.position.x;
                sticky.y = a.position.y;
            }
            if (a.parent_id) {
                const par = yield figma.getNodeByIdAsync(a.parent_id);
                if (par && 'appendChild' in par)
                    par.appendChild(sticky);
            }
            return sticky;
        }
        catch (e) {
            errors.push(`insert_new_sticky: ${String(e)}`);
        }
        return null;
    });
}
function applyInsertFrame(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const frame = figma.createFrame();
            frame.x = a.x;
            frame.y = a.y;
            frame.resizeWithoutConstraints(a.width, a.height);
            if (a.name)
                frame.name = a.name;
            if (a.parent_id) {
                const par = yield figma.getNodeByIdAsync(a.parent_id);
                if (par && 'appendChild' in par)
                    par.appendChild(frame);
            }
            return frame;
        }
        catch (e) {
            errors.push(`insert_frame: ${String(e)}`);
        }
        return null;
    });
}
function applyInsertText(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const t = figma.createText();
            yield figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
            t.characters = a.text;
            t.x = a.x;
            t.y = a.y;
            if (a.parent_id) {
                const par = yield figma.getNodeByIdAsync(a.parent_id);
                if (par && 'appendChild' in par)
                    par.appendChild(t);
            }
            return t;
        }
        catch (e) {
            errors.push(`insert_text: ${String(e)}`);
        }
        return null;
    });
}
function applyInsertSection(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sec = figma.createSection();
            sec.x = a.x;
            sec.y = a.y;
            sec.resizeWithoutConstraints(a.width, a.height);
            if (a.name)
                sec.name = a.name;
            return sec;
        }
        catch (e) {
            errors.push(`insert_section: ${String(e)}`);
        }
        return null;
    });
}
function applyInsertRectangle(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rect = figma.createRectangle();
            rect.x = a.x;
            rect.y = a.y;
            rect.resize(a.width, a.height);
            if (a.parent_id) {
                const par = yield figma.getNodeByIdAsync(a.parent_id);
                if (par && 'appendChild' in par)
                    par.appendChild(rect);
            }
            return rect;
        }
        catch (e) {
            errors.push(`insert_rectangle: ${String(e)}`);
        }
        return null;
    });
}
function applyInsertEllipse(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const el = figma.createEllipse();
            el.x = a.x;
            el.y = a.y;
            el.resize(a.width, a.height);
            if (a.parent_id) {
                const par = yield figma.getNodeByIdAsync(a.parent_id);
                if (par && 'appendChild' in par)
                    par.appendChild(el);
            }
            return el;
        }
        catch (e) {
            errors.push(`insert_ellipse: ${String(e)}`);
        }
        return null;
    });
}
function applySetStickyColor(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || node.type !== 'STICKY') {
            errors.push(`set_sticky_color: STICKY node ${a.target} not found`);
            return;
        }
        node.fills = [solidPaint(a.r, a.g, a.b)];
    });
}
function applySetSectionHidden(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.target);
        if (!node || node.type !== 'SECTION') {
            errors.push(`set_section_hidden: SECTION node ${a.target} not found`);
            return;
        }
        node.sectionContentsHidden = a.hidden;
    });
}
function applyRepositionSection(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(a.section_id);
        if (!node) {
            errors.push(`reposition_section: node ${a.section_id} not found`);
            return;
        }
        node.x = a.new_x;
        node.y = a.new_y;
    });
}
function applyDuplicateSection(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const node = yield figma.getNodeByIdAsync(a.source_id);
        if (!node || !('clone' in node)) {
            errors.push(`duplicate_section: node ${a.source_id} not found`);
            return null;
        }
        const clone = node.clone();
        if (a.new_parent_id) {
            const par = yield figma.getNodeByIdAsync(a.new_parent_id);
            if (par && 'appendChild' in par)
                par.appendChild(clone);
        }
        if ('x' in clone)
            clone.x += ((_a = a.offset_x) !== null && _a !== void 0 ? _a : 80);
        if ('y' in clone)
            clone.y += ((_b = a.offset_y) !== null && _b !== void 0 ? _b : 80);
        return clone;
    });
}
function applyScrollIntoView(a, errors) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodes = [];
        for (const id of a.node_ids) {
            const n = yield figma.getNodeByIdAsync(id);
            if (n)
                nodes.push(n);
            else
                errors.push(`scroll_into_view: node ${id} not found`);
        }
        if (nodes.length > 0)
            figma.viewport.scrollAndZoomIntoView(nodes);
    });
}
function applyRepeatedGridIntent(intent) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const errors = [];
        let count = 0;
        const nodesToReveal = [];
        // ── Path A: whole-group duplication ─────────────────────────────────────
        // UI pre-computed spatial groups; each group = one "person slot" (NAME + grid)
        if (intent.groupIds && intent.groupIds.length >= 2) {
            const groups = [];
            for (const ids of intent.groupIds) {
                const nodes = [];
                for (const id of ids) {
                    const n = yield figma.getNodeByIdAsync(id);
                    if (n && !n.removed)
                        nodes.push(n);
                }
                if (nodes.length === 0)
                    continue;
                const bounds = combineBounds(nodes);
                if (bounds)
                    groups.push({ nodes, bounds });
            }
            if (groups.length >= 2) {
                // Sort by reading order
                groups.sort((a, b) => {
                    const rowTol = Math.max(24, Math.min(a.bounds.height, b.bounds.height) * 0.4);
                    if (Math.abs(a.bounds.y - b.bounds.y) <= rowTol)
                        return a.bounds.x - b.bounds.x;
                    return a.bounds.y - b.bounds.y;
                });
                const existingCount = groups.length;
                const targetCount = Math.max(1, (_a = intent.targetCount) !== null && _a !== void 0 ? _a : (existingCount + ((_b = intent.addCount) !== null && _b !== void 0 ? _b : 0)));
                if (targetCount > existingCount) {
                    // Detect groups per row
                    const firstY = groups[0].bounds.y;
                    const rowTol = Math.max(48, groups[0].bounds.height * 0.4);
                    const groupsPerRow = Math.max(1, groups.filter(g => Math.abs(g.bounds.y - firstY) <= rowTol).length);
                    // Detect row spacing
                    let rowSpacing;
                    if (existingCount > groupsPerRow) {
                        rowSpacing = groups[groupsPerRow].bounds.y - groups[0].bounds.y;
                    }
                    else {
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
                            if (!('clone' in node)) {
                                errors.push(`Cannot clone node ${node.id}`);
                                continue;
                            }
                            const clone = node.clone();
                            if ('y' in clone)
                                clone.y += dy;
                            nodesToReveal.push(clone);
                            count++;
                        }
                    }
                }
                else if (targetCount < existingCount) {
                    for (const group of groups.slice(targetCount)) {
                        for (const node of group.nodes) {
                            if (!node.removed) {
                                node.remove();
                                count++;
                            }
                        }
                    }
                }
                if (nodesToReveal.length > 0)
                    figma.viewport.scrollAndZoomIntoView(nodesToReveal);
                return { count, errors };
            }
        }
        // ── Path B: sticky-column fallback ──────────────────────────────────────
        const groups = getConnectedRepeatedGroups(collectRepeatedGridCandidates())
            .map(analyzeRepeatedGridGroup)
            .filter((group) => group !== null);
        if (groups.length === 0) {
            return { count: 0, errors: ['No repeated sticky grid found in the selection'] };
        }
        for (const group of groups) {
            const columns = [...group.columns];
            const existingCount = columns.length;
            const targetCount = Math.max(1, (_c = intent.targetCount) !== null && _c !== void 0 ? _c : (existingCount + ((_d = intent.addCount) !== null && _d !== void 0 ? _d : 0)));
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
                    const clones = [];
                    for (const sourceNode of template.nodes) {
                        if (!('clone' in sourceNode)) {
                            errors.push(`Cannot duplicate ${sourceNode.type} node ${sourceNode.id}`);
                            continue;
                        }
                        const clone = sourceNode.clone();
                        if ('x' in clone)
                            clone.x += group.stepX * offsetIndex;
                        clones.push(clone);
                        nodesToReveal.push(clone);
                        count += 1;
                    }
                    const centerX = template.centerX + (group.stepX * offsetIndex);
                    clones.sort((a, b) => { var _a, _b, _c, _d; return ((_b = ((_a = getNodeBounds(a)) === null || _a === void 0 ? void 0 : _a.y)) !== null && _b !== void 0 ? _b : 0) - ((_d = ((_c = getNodeBounds(b)) === null || _c === void 0 ? void 0 : _c.y)) !== null && _d !== void 0 ? _d : 0); });
                    columns.push({ centerX, nodes: clones });
                }
            }
            if (intent.names && intent.names.length > 0) {
                const limit = Math.min(intent.names.length, columns.length);
                for (let i = 0; i < limit; i += 1) {
                    const topNode = columns[i].nodes[0];
                    if (!topNode)
                        continue;
                    if (yield setTextOnSceneNode(topNode, intent.names[i], errors)) {
                        count += 1;
                    }
                }
            }
        }
        if (nodesToReveal.length > 0) {
            figma.viewport.scrollAndZoomIntoView(nodesToReveal);
        }
        return { count, errors };
    });
}
function applyOrderedSwapIntent(intent) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        // Build groups: prefer pre-computed groupIds from UI, fall back to Figma selection clustering
        let groups;
        if (intent.groupIds && intent.groupIds.length >= Math.max(intent.firstIndex, intent.secondIndex)) {
            const resolved = [];
            for (const ids of intent.groupIds) {
                const nodes = [];
                for (const id of ids) {
                    const n = yield figma.getNodeByIdAsync(id);
                    if (n && !n.removed)
                        nodes.push(n);
                }
                if (nodes.length > 0)
                    resolved.push(nodes);
            }
            groups = resolved;
        }
        else {
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
                const sceneNode = node;
                errors.push(`Cannot move ${sceneNode.type} node ${sceneNode.id}`);
                continue;
            }
            const positioned = node;
            positioned.x += firstDx;
            positioned.y += firstDy;
            count += 1;
        }
        for (const node of secondGroup) {
            if (!('x' in node) || !('y' in node)) {
                const sceneNode = node;
                errors.push(`Cannot move ${sceneNode.type} node ${sceneNode.id}`);
                continue;
            }
            const positioned = node;
            positioned.x += secondDx;
            positioned.y += secondDy;
            count += 1;
        }
        figma.viewport.scrollAndZoomIntoView([...firstGroup, ...secondGroup]);
        return { count, errors };
    });
}
// ─── Main dispatcher ──────────────────────────────────────────────────────────
function applyActions(actions) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        let count = 0;
        const nodesToReveal = [];
        for (const a of actions) {
            if (!KNOWN_ACTIONS.has(a.action)) {
                errors.push(`Unknown action: ${a.action}`);
                continue;
            }
            switch (a.action) {
                case 'update_text':
                    yield applyUpdateText(a, errors);
                    break;
                case 'set_font_size':
                    yield applySetFontSize(a, errors);
                    break;
                case 'set_font_color':
                    yield applySetFontColor(a, errors);
                    break;
                case 'set_text_align':
                    yield applySetTextAlign(a, errors);
                    break;
                case 'set_text_decoration':
                    yield applySetTextDecoration(a, errors);
                    break;
                case 'set_text_case':
                    yield applySetTextCase(a, errors);
                    break;
                case 'move_node':
                    yield applyMoveNode(a, errors);
                    break;
                case 'move_nodes_down':
                    yield applyMoveNodesDown(a, errors);
                    break;
                case 'resize_node':
                    yield applyResizeNode(a, errors);
                    break;
                case 'rotate_node':
                    yield applyRotateNode(a, errors);
                    break;
                case 'set_fill_color':
                    yield applySetFillColor(a, errors);
                    break;
                case 'set_stroke':
                    yield applySetStroke(a, errors);
                    break;
                case 'set_opacity':
                    yield applySetOpacity(a, errors);
                    break;
                case 'set_corner_radius':
                    yield applySetCornerRadius(a, errors);
                    break;
                case 'set_visible':
                    yield applySetVisible(a, errors);
                    break;
                case 'set_blend_mode':
                    yield applySetBlendMode(a, errors);
                    break;
                case 'lock_nodes':
                    yield applyLockNodes(a, errors);
                    break;
                case 'unlock_nodes':
                    yield applyUnlockNodes(a, errors);
                    break;
                case 'rename_node':
                    yield applyRenameNode(a, errors);
                    break;
                case 'delete_nodes':
                    yield applyDeleteNodes(a, errors);
                    break;
                case 'duplicate_node': {
                    const clone = yield applyDuplicateNode(a, errors);
                    if (clone)
                        nodesToReveal.push(clone);
                    break;
                }
                case 'group_nodes':
                    yield applyGroupNodes(a, errors);
                    break;
                case 'ungroup_node':
                    yield applyUngroupNode(a, errors);
                    break;
                case 'move_to_front':
                    yield applyMoveToFront(a, errors);
                    break;
                case 'move_to_back':
                    yield applyMoveToBack(a, errors);
                    break;
                case 'insert_new_sticky': {
                    const sticky = yield applyInsertNewSticky(a, errors);
                    if (sticky)
                        nodesToReveal.push(sticky);
                    break;
                }
                case 'insert_frame': {
                    const frame = yield applyInsertFrame(a, errors);
                    if (frame)
                        nodesToReveal.push(frame);
                    break;
                }
                case 'insert_text': {
                    const text = yield applyInsertText(a, errors);
                    if (text)
                        nodesToReveal.push(text);
                    break;
                }
                case 'insert_section': {
                    const section = yield applyInsertSection(a, errors);
                    if (section)
                        nodesToReveal.push(section);
                    break;
                }
                case 'insert_rectangle': {
                    const rect = yield applyInsertRectangle(a, errors);
                    if (rect)
                        nodesToReveal.push(rect);
                    break;
                }
                case 'insert_ellipse': {
                    const ellipse = yield applyInsertEllipse(a, errors);
                    if (ellipse)
                        nodesToReveal.push(ellipse);
                    break;
                }
                case 'set_sticky_color':
                    yield applySetStickyColor(a, errors);
                    break;
                case 'set_section_hidden':
                    yield applySetSectionHidden(a, errors);
                    break;
                case 'reposition_section':
                    yield applyRepositionSection(a, errors);
                    break;
                case 'duplicate_section': {
                    const sectionClone = yield applyDuplicateSection(a, errors);
                    if (sectionClone)
                        nodesToReveal.push(sectionClone);
                    break;
                }
                case 'scroll_into_view':
                    yield applyScrollIntoView(a, errors);
                    break;
            }
            count++;
        }
        if (nodesToReveal.length > 0) {
            figma.viewport.scrollAndZoomIntoView(nodesToReveal);
        }
        return { count, errors };
    });
}
// ─── Plugin entry point ───────────────────────────────────────────────────────
figma.showUI(__html__, { width: 420, height: 560 });
function sendSelection() {
    try {
        const sel = figma.currentPage.selection;
        console.log('[FigJam AI] sendSelection — selection count:', sel.length, sel.map(n => n.type + ':' + n.id));
        const nodes = sel
            .map((n) => { try {
            return serializeNode(n);
        }
        catch (e) {
            console.error('[FigJam AI] serialize error', e);
            return null;
        } })
            .filter((n) => n !== null);
        const snap = getBoardSnapshot();
        console.log('[FigJam AI] boardSnapshot count:', snap.length);
        figma.ui.postMessage({ type: 'selection', nodes, boardSnapshot: snap, hasSelection: sel.length > 0 });
    }
    catch (err) {
        console.error('[FigJam AI] sendSelection error:', err);
    }
}
figma.on('selectionchange', sendSelection);
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (msg.type === 'ready' || msg.type === 'request-selection') {
            sendSelection();
            return;
        }
        if (msg.type === 'get-api-key') {
            const key = (_a = (yield figma.clientStorage.getAsync('api-key'))) !== null && _a !== void 0 ? _a : '';
            figma.ui.postMessage({ type: 'api-key', key });
            return;
        }
        if (msg.type === 'save-api-key' && typeof msg.key === 'string') {
            yield figma.clientStorage.setAsync('api-key', msg.key);
            return;
        }
        if (msg.type === 'apply-actions' && msg.actions) {
            const result = yield applyActions(msg.actions);
            figma.ui.postMessage({ type: 'apply-complete', count: result.count, errors: result.errors });
            return;
        }
        if (msg.type === 'apply-layout-intent' && msg.intent) {
            const result = msg.intent.kind === 'ordered-swap'
                ? yield applyOrderedSwapIntent(msg.intent)
                : yield applyRepeatedGridIntent(msg.intent);
            figma.ui.postMessage({ type: 'apply-complete', count: result.count, errors: result.errors });
            return;
        }
        if (msg.type === 'close')
            figma.closePlugin();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[FigJam AI] onmessage error:', message);
        figma.ui.postMessage({ type: 'plugin-error', message });
    }
});
