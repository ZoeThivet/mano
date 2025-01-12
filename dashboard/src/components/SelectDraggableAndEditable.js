import React, { useCallback, useEffect, useRef, useState } from 'react';
import { components } from 'react-select';
import SortableJS from 'sortablejs';
import SelectCustom from './SelectCustom';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';

const SelectDraggableAndEditable = ({ onChange, classNamePrefix, value, onEditChoice, editChoiceWarning, options, ...props }) => {
  const [editingChoice, setEditingChoice] = useState('');
  const [newChoice, setNewChoice] = useState('');

  const onDragAndDrop = useCallback(async () => {
    const grid = gridRef.current;
    const items = grid.querySelectorAll(`.${classNamePrefix}__multi-value__label`);
    const newValue = [];
    for (const item of items) {
      // If fromValue is undefined, it means that the item is a new one.
      const fromValue = value.find((_item) => _item.label === item.innerText);
      if (fromValue) {
        newValue.push(fromValue);
      } else {
        newValue.push({ label: item.innerText, value: item.innerText });
      }
    }
    onChange(newValue);
  }, [classNamePrefix, onChange, value]);

  const gridRef = useRef(null);
  const sortableRef = useRef(null);
  useEffect(() => {
    gridRef.current = document.querySelector(`.${classNamePrefix}__value-container--is-multi`);
    gridRef.current.lastChild.classList.add('not-draggable'); // this is the input {classNamePrefix}__input-container
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: classNamePrefix,
      onEnd: onDragAndDrop,
    });
  }, [options, props.value, onDragAndDrop, classNamePrefix]);

  return (
    <>
      <SelectCustom
        components={{
          Input: (myProps) => {
            return <components.Input {...myProps} inputClassName="input-focus-helper" />;
          },
          MultiValueLabel: (props) => {
            return (
              <>
                <components.MultiValueLabel
                  {...props}
                  innerProps={{
                    ...props.innerProps,
                    onMouseDown: (e) => {
                      e.stopPropagation();
                    },
                    className: `${props.innerProps.className} tw-cursor-move`,
                  }}
                />
                {!!onEditChoice && (
                  <button
                    aria-label={`Modifier le choix ${props.children}`}
                    title={`Modifier le choix ${props.children}`}
                    className={`tw-ml-2 ${classNamePrefix}__multi-value__edit tw-rounded-sm tw-px-1 hover:tw-bg-[#FFBDAD] hover:tw-text-[#DE350B]`}
                    onClick={() => setEditingChoice(props.children)}
                    type="button">
                    &#9998;
                  </button>
                )}
              </>
            );
          },
        }}
        classNamePrefix={classNamePrefix}
        onChange={onChange}
        value={value}
        options={options}
        {...props}
        isMulti
      />
      <ModalContainer open={!!editingChoice}>
        <ModalHeader title={`Éditer le choix: ${editingChoice}`} />
        <ModalBody>
          <form id="edit-choice-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8">
            <div>
              <label htmlFor="newChoice" className="form-text tailwindui">
                Nouveau nom du choix
              </label>
              <input
                className="form-text tailwindui"
                id="newChoice"
                name="newChoice"
                type="text"
                placeholder={editingChoice}
                value={newChoice}
                onChange={(e) => setNewChoice(e.target.value)}
              />
              <input id="oldChoice" name="oldChoice" type="hidden" value={editingChoice} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            name="cancel"
            className="button-cancel"
            onClick={() => {
              setEditingChoice('');
              setNewChoice('');
            }}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={!newChoice?.length}
            className="button-submit"
            form="edit-choice-form"
            onClick={(e) => {
              e.preventDefault();
              if (newChoice === editingChoice) {
                setEditingChoice('');
                setNewChoice('');
                return;
              }
              if (options.map((option) => option.label).includes(newChoice)) {
                alert('Ce choix existe déjà');
                return;
              }
              onEditChoice({ newChoice, oldChoice: editingChoice, options });
              setEditingChoice('');
              setNewChoice('');
            }}>
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default SelectDraggableAndEditable;
