import {
  faculties,
  facultyAbbreviations,
  facultyDepartments,
} from '@idikaeliada/futo-departments';
import type { Department as PackageDepartment, Faculty as PackageFaculty } from '@idikaeliada/futo-departments';
import type { Faculty } from '../sharedTypes';

// Keep the legacy SMAT wire code for existing records while using the package's
// official full faculty name (and its department list) in the app UI.
const facultyCodeOverrides: Partial<Record<PackageFaculty, Faculty>> = {
  'School of Physical Sciences': 'SMAT',
};

export interface FutoFacultyOption {
  code: Faculty;
  name: PackageFaculty;
  departments: readonly PackageDepartment[];
}

export const FUTO_FACULTY_OPTIONS: FutoFacultyOption[] = faculties.map((name) => ({
  code: facultyCodeOverrides[name] ?? (facultyAbbreviations[name] as Faculty),
  name,
  departments: facultyDepartments[name],
}));

export const FUTO_DEPARTMENTS: readonly PackageDepartment[] = Object.freeze(
  FUTO_FACULTY_OPTIONS.flatMap((faculty) => [...faculty.departments])
);

export function getFacultyName(code: Faculty | null | undefined): string | null {
  return FUTO_FACULTY_OPTIONS.find((faculty) => faculty.code === code)?.name ?? code ?? null;
}
