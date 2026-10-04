/**
 * Blender appends ".001", ".002"… when duplicating objects. Exporters keep the
 * suffix, so "Biceps_Brachii_L.001" should resolve like "Biceps_Brachii_L".
 */
const BLENDER_DUPLICATE_SUFFIX = /\.\d{3}$/;

export function stripDuplicateSuffix(meshName: string): string {
  return meshName.trim().replace(BLENDER_DUPLICATE_SUFFIX, "");
}

/** Minimal shape of a three.js Object3D needed to resolve its source name. */
export interface NamedNode {
  name: string;
  userData: Record<string, unknown>;
  parent: NamedNode | null;
}

/**
 * three's GLTFLoader sanitizes node names (removes ".", ":", "/", "[", "]"
 * and replaces whitespace) but keeps the original glTF name in
 * `userData.name`. Mapping files are written against the original names.
 */
export function getSourceName(node: NamedNode): string {
  const original = node.userData.name;
  return typeof original === "string" && original.length > 0
    ? original
    : node.name;
}
