import React, { useEffect, useRef } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Sortable from 'sortablejs';
import { theme } from '../config';

const SelectCustom = ({ creatable, sortable, ...props }) => {
  const Component = creatable ? CreatableSelect : Select;

  if (!sortable) return <Component {...basicProps} {...props} />;

  if (!props.classNamePrefix) throw new Error('Provide a classNamePrefix if you want a sortable select');

  return <SortableSelect creatable={creatable} {...props} />;
};

const SortableSelect = ({ creatable, sortable, ...props }) => {
  const sortableJsRef = useRef(null);

  const Component = creatable ? CreatableSelect : Select;

  const valueContainer = document.querySelector(`.${props.classNamePrefix}__value-container`);

  useEffect(() => {
    if (!!valueContainer) {
      sortableJsRef.current = new Sortable(valueContainer, {
        animation: 150,
        onEnd: console.log,
      });
    }
  }, [props.classNamePrefix, valueContainer]);

  return <Component {...basicProps} {...props} />;
};

const basicProps = {
  theme: (defaultTheme) => ({
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: theme.main,
      primary25: theme.main25,
      primary50: theme.main50,
      primary75: theme.main75,
    },
  }),
  placeholder: '-- Choisir --',
  noOptionsMessage: () => 'Aucun résultat',
  formatCreateLabel: (inputValue) => `Ajouter "${inputValue}"`,
  styles: {
    // control: (styles) => ({ ...styles, borderWidth: 0 }),
    indicatorSeparator: (styles) => ({ ...styles, borderWidth: 0, backgroundColor: 'transparent' }),
  },
};

export default SelectCustom;
