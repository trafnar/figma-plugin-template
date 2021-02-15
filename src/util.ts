export const unionRect = (
  selection: readonly SceneNode[],
  useAbs = false
): Rect => {
  let left: number[] = []
  let right: number[] = []
  let top: number[] = []
  let bottom: number[] = []
  selection.forEach((n, i) => {
    const x = useAbs ? n.absoluteTransform[0][2] : n.x
    const y = useAbs ? n.absoluteTransform[1][2] : n.y
    left.push(x)
    right.push(x + n.width)
    top.push(y)
    bottom.push(y + n.height)
  })
  const minLeft = Math.min(...left)
  const minTop = Math.min(...top)
  return {
    x: minLeft,
    y: minTop,
    width: Math.max(...right) - minLeft,
    height: Math.max(...bottom) - minTop,
  }
}

export const getTotalFrameOffset = (layer: BaseNode) => {
  // absoluteSelectionRect.x - parentFrame.x
  // need to do this, but continually subtract parent frame positions
  const position = { x: 0, y: 0 }
  let current = layer
  if (current === null) {
    return position
  } else {
    while (current.type !== "DOCUMENT") {
      if (isOfType(current, ["FRAME", "COMPONENT"])) {
        position.x = position.x + (current as any).x
        position.y = position.y + (current as any).y
      }
      if (current.parent != null) {
        current = current.parent
      } else {
        return position
      }
    }
    return position
  }
}

export const isLayerAnOrphan = (layer: BaseNode) => {
  return (
    !hasParentOfType(layer, "FRAME") &&
    !hasParentOfType(layer, "COMPONENT") &&
    !hasParentOfType(layer, "INSTANCE")
  )
}

export const isOfType = (node: BaseNode, type: string | string[]): boolean => {
  let arrayOfTypes
  if (typeof type === "string") {
    arrayOfTypes = [type]
  } else {
    arrayOfTypes = type
  }
  return arrayOfTypes.includes(node.type)
}

export const findFirstParentOfType = (
  layer: BaseNode,
  type: string | string[]
) => {
  let current = layer.parent
  if (current === null) {
    return null
  }
  while (current.type !== "DOCUMENT") {
    if (isOfType(current, type)) {
      return current
    }
    if (current.parent !== null) {
      current = current.parent
    } else {
      return null
    }
  }
  return null
}

export const hasParentOfType = (
  layer: BaseNode,
  type: string | string[]
): boolean => {
  if (type === "DOCUMENT") {
    return true
  }
  return findFirstParentOfType(layer, type) !== null
}

export const canBeComponentized = (
  selection: readonly SceneNode[]
): boolean => {
  for (let layer of selection) {
    if (hasParentOfType(layer, ["INSTANCE"]) || layer.type === "COMPONENT") {
      return false
    }
  }
  return true
}

export const getAbsoluteRect = (node: SceneNode): Rect => {
  const result = {
    x: node.absoluteTransform[0][2],
    y: node.absoluteTransform[1][2],
    width: node.width,
    height: node.height,
  }
  return result
}

export const setSizeAndPositionToRect = (node: SceneNode, rect: Rect): void => {
  node.x = rect.x
  node.y = rect.y
  node.resize(rect.width, rect.height)
}

export const findKeyLayerOfSelection = (selection: readonly SceneNode[]) => {
  // this mimics figma's behavior of always using the parent of the last node
  return selection[selection.length - 1]
}

export const getIndexOfNode = (node: SceneNode): number | null => {
  const siblings = node.parent?.children
  let result = null
  if (siblings !== undefined) {
    // const numSiblings = siblings.length - 1
    siblings.forEach((n, i) => {
      if (n.id === node.id) {
        result = i
      }
    })
  }
  return result
}

export const getSharedParent = (nodes: readonly SceneNode[]) => {
  // returns the parent if all nodes have same parent
  // otherwise returns null
  let parent = null
  for (let node of nodes) {
    if (parent === null) {
      parent = node.parent
    } else if (node.parent != parent) {
      return null
    }
  }
  return parent
}

export const explode = (component: ComponentNode, instance: InstanceNode) => {
  const children = component.children
  if (children.length > 1) {
    // can only explode a single layer
    return
  } else {
    let child = children[0]
    const parent = child.parent
    if (isOfType(child, "GROUP")) {
      child = child as GroupNode
      if (parent !== null) {
        copyProperties(child, parent as SceneNode, groupPropertiesToCopy)
        copyProperties(child, instance, groupPropertiesToCopyToInstance)
      }
    } else if (isOfType(child, "FRAME")) {
      child = child as FrameNode
      if (parent !== null) {
        copyProperties(child, parent as SceneNode, framePropertiesToCopy)
        copyProperties(child, instance, framePropertiesToCopyToInstance)
      }
    } else {
      return
    }
    const toExplode = child.children

    for (let l of toExplode) {
      parent?.appendChild(l.clone())
      l.remove()
    }
    if (isOfType(child, "FRAME") && child.children.length === 0) {
      // remove empty frame
      child.remove()
    }
  }
}

const groupPropertiesToCopyToInstance = ["locked", "visible", "rotation"]

const framePropertiesToCopyToInstance = [
  "locked",
  "visible",
  "rotation",
  "constraints",
  "exportSettings",
]

const groupPropertiesToCopy = [
  "expanded",
  "strokes",
  "strokeWeight",
  "strokeMiterLimit",
  "strokeAlign",
  "strokeCap",
  "strokeJoin",
  "dashPattern",
  "fillStyleId",
  "strokeStyleId",
  "cornerSmoothing",
  "topLeftRadius",
  "topRightRadius",
  "bottomLeftRadius",
  "bottomRightRadius",
  "cornerRadius",
  "opacity",
  "blendMode",
  "isMask",
  "effects",
  "effectStyleId",
  "rotation",
  "layoutAlign",
  "layoutGrow",
  "overflowDirection",
  "numberOfFixedChildren",
  "exportSettings",
]

const framePropertiesToCopy = [
  "clipsContent",
  "guides",
  "layoutGrids",
  "gridStyleId",
  "layoutMode",
  "primaryAxisSizingMode",
  "counterAxisSizingMode",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "itemSpacing",
  "expanded",
  "fills",
  "strokes",
  "strokeWeight",
  "strokeMiterLimit",
  "strokeAlign",
  "strokeCap",
  "strokeJoin",
  "dashPattern",
  "fillStyleId",
  "strokeStyleId",
  "cornerSmoothing",
  "topLeftRadius",
  "topRightRadius",
  "bottomLeftRadius",
  "bottomRightRadius",
  "cornerRadius",
  "opacity",
  "blendMode",
  "isMask",
  "effects",
  "effectStyleId",
  "rotation",
  "layoutAlign",
  "layoutGrow",
  "constraints",
  "exportSettings",
  "overflowDirection",
  "numberOfFixedChildren",
]

const copyProperties = (
  from: SceneNode,
  to: SceneNode,
  properties: string[]
) => {
  for (const prop of properties) {
    const value = (from as any)[prop]
    const destination = to as any
    if (typeof value !== "undefined") {
      if (!(prop == "cornerRadius" && value == figma.mixed)) {
        destination[prop] = value
      }
    }
  }
}
