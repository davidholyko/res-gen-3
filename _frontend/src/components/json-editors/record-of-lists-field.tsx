import c from 'classnames';
import { useCallback, useState } from 'react';

import { useStopKeydownPropagationRef } from './use-stop-keydown-propagation';

type RecordOfListsFieldProps = {
  fieldId: string;
  label: string;
  value: Record<string, string[]>;
  error: string;
  errorId: string;
  onChange: (next: Record<string, string[]>) => void;
};

type NameError = {
  index: number;
  message: string;
};

// Repeating named groups for a Record<string, string[]>
// (specs/editor-redesign.md, `record-of-lists` field kind, AnyList's
// shape): each group is a name input plus its own list of entries, with
// add/remove at both the group level and the entry-within-group level.
// Unlike every other field kind this one edits the *whole* content
// object -- the record's keys are themselves user data, not a fixed
// field name.
export default function RecordOfListsField(props: RecordOfListsFieldProps) {
  const { fieldId, label, value, error, errorId } = props;
  const { onChange } = props;

  // A rename that collides with another group's name is blocked, not
  // committed: the record is a plain object, so Object.fromEntries would
  // silently merge the two groups and destroy one's entries. Local
  // state, not content: it describes an edit that was refused.
  const [nameError, setNameError] = useState<NameError | null>(null);
  const stopKeydownPropagationRef = useStopKeydownPropagationRef();

  // Object.entries preserves string-key insertion order, so groups keep
  // their positions across renames/edits.
  const groups = Object.entries(value);

  const commitGroups = useCallback(
    (nextGroups: [string, string[]][]) => {
      onChange(Object.fromEntries(nextGroups));
    },
    [onChange],
  );

  const onRenameGroup = useCallback(
    (index: number, name: string) => {
      const collides = groups.some(
        ([groupName], i) => i !== index && groupName === name,
      );
      if (collides) {
        setNameError({ index, message: `"${name}" is already a group name` });
        return;
      }

      setNameError(null);
      const next = groups.map<[string, string[]]>(([groupName, entries], i) =>
        i === index ? [name, entries] : [groupName, entries],
      );
      commitGroups(next);
    },
    [groups, commitGroups],
  );

  const onRemoveGroup = useCallback(
    (index: number) => {
      // Indexes shift; any blocked-rename message would point at the
      // wrong group afterwards.
      setNameError(null);
      commitGroups(groups.filter((_, i) => i !== index));
    },
    [groups, commitGroups],
  );

  const onAddGroup = useCallback(() => {
    let name = 'New group';
    for (let n = 2; name in value; n++) {
      name = `New group ${n}`;
    }
    commitGroups([...groups, [name, []]]);
  }, [groups, value, commitGroups]);

  const onEntryChange = useCallback(
    (groupIndex: number, entryIndex: number, entry: string) => {
      const next = groups.map<[string, string[]]>(([groupName, entries], i) =>
        i === groupIndex
          ? [groupName, entries.map((e, j) => (j === entryIndex ? entry : e))]
          : [groupName, entries],
      );
      commitGroups(next);
    },
    [groups, commitGroups],
  );

  const onAddEntry = useCallback(
    (groupIndex: number) => {
      const next = groups.map<[string, string[]]>(([groupName, entries], i) =>
        i === groupIndex ? [groupName, [...entries, '']] : [groupName, entries],
      );
      commitGroups(next);
    },
    [groups, commitGroups],
  );

  const onRemoveEntry = useCallback(
    (groupIndex: number, entryIndex: number) => {
      const next = groups.map<[string, string[]]>(([groupName, entries], i) =>
        i === groupIndex
          ? [groupName, entries.filter((_, j) => j !== entryIndex)]
          : [groupName, entries],
      );
      commitGroups(next);
    },
    [groups, commitGroups],
  );

  const inputClassName = c('grow p-2 bg-emerald-100', {
    'outline outline-2 outline-red-700': !!error,
  });

  const buttonClassName =
    'px-2 py-1 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-40';

  const containerClassName = 'flex flex-col gap-2 w-auto';

  return (
    // fieldset/legend, same reasoning as list-field.tsx: this is a group
    // of many controls, not something a single <label> can point at.
    <fieldset>
      <legend className="text-xs font-bold text-gray-600">{label}</legend>
      <div className={containerClassName}>
        {groups.map(([groupName, entries], groupIndex) => {
          const nameInputId =
            groupIndex === 0 ? fieldId : `${fieldId}-group-${groupIndex}`;
          const groupNameError =
            nameError?.index === groupIndex ? nameError.message : '';
          const nameErrorId = `${nameInputId}-name-error`;

          return (
            // Index keys, same reasoning as list-field.tsx: rows carry no
            // local state, values come straight from props.
            <div
              key={groupIndex}
              className="flex flex-col gap-1 border border-gray-300 rounded p-2"
            >
              <div className="flex flex-row items-center gap-1">
                <input
                  type="text"
                  id={nameInputId}
                  className={c(inputClassName, 'font-bold', {
                    'outline outline-2 outline-red-700': !!groupNameError,
                  })}
                  spellCheck="false"
                  aria-label={`Group ${groupIndex + 1} name`}
                  value={groupName}
                  onChange={(event) =>
                    onRenameGroup(groupIndex, event.target.value)
                  }
                  ref={stopKeydownPropagationRef}
                  aria-invalid={!!groupNameError || !!error}
                  aria-describedby={
                    groupNameError ? nameErrorId : error ? errorId : undefined
                  }
                />
                <button
                  type="button"
                  className={buttonClassName}
                  aria-label={`Remove group ${groupIndex + 1}`}
                  title="Remove this group"
                  onClick={() => onRemoveGroup(groupIndex)}
                >
                  ✕
                </button>
              </div>
              {groupNameError && (
                <p
                  id={nameErrorId}
                  role="alert"
                  className="text-xs font-bold text-red-700"
                >
                  {groupNameError}
                </p>
              )}
              {entries.map((entry, entryIndex) => (
                <div
                  key={entryIndex}
                  className="flex flex-row items-center gap-1 ml-4"
                >
                  <input
                    type="text"
                    className={inputClassName}
                    spellCheck="false"
                    aria-label={`Group ${groupIndex + 1} entry ${entryIndex + 1}`}
                    value={entry}
                    onChange={(event) =>
                      onEntryChange(groupIndex, entryIndex, event.target.value)
                    }
                    ref={stopKeydownPropagationRef}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                  />
                  <button
                    type="button"
                    className={buttonClassName}
                    aria-label={`Remove group ${groupIndex + 1} entry ${entryIndex + 1}`}
                    title="Remove"
                    onClick={() => onRemoveEntry(groupIndex, entryIndex)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={c(buttonClassName, 'self-start ml-4 text-sm')}
                aria-label={`Add entry to group ${groupIndex + 1}`}
                onClick={() => onAddEntry(groupIndex)}
              >
                + Add entry
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className={c(buttonClassName, 'self-start text-sm')}
          aria-label="Add group"
          onClick={onAddGroup}
        >
          + Add group
        </button>
      </div>
    </fieldset>
  );
}
