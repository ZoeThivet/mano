import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../config';

const IncrementorSmall = ({ service, count, onChange }) => {
  const [localcount, setLocalcount] = useState(count);

  const changeTimeout = useRef(null);

  useEffect(() => {
    setLocalcount(count);
  }, [count]);

  const onChangeRequest = async (newCount) => {
    newCount = Number(parseInt(newCount, 10).toString());
    setLocalcount(newCount);
    clearTimeout(changeTimeout.current);
    changeTimeout.current = setTimeout(() => onChange(newCount), 1000);
  };
  return (
    <IncrementorSmallWrapper>
      <div id={`${service}-title`} className="service-name">
        {service}
      </div>
      <ButtonRemoveAdd aria-label="moins" disabled={localcount === 0} onClick={() => onChangeRequest(localcount - 1)} id={`${service}-remove`}>-</ButtonRemoveAdd>
      <LocalCount aria-label={`Nombre de ${service}`} id={`${service}-count`}>
        {localcount}
      </LocalCount>
      <ButtonRemoveAdd aria-label="plus" onClick={() => onChangeRequest(localcount + 1)} id={`${service}-add`}>+</ButtonRemoveAdd>
    </IncrementorSmallWrapper>
  );
};

const IncrementorSmallWrapper = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  .service-name {
    flex-grow: 1;
    color: ${theme.black75};
  }
`;
const LocalCount = styled.div`
  width: 40px;
  text-align: center;
  color: ${theme.black75};
`;

const ButtonRemoveAdd = styled.button`
  background: none;
  border: 1px solid ${theme.main};
  width: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${theme.main};
  border-radius: 20%;
  &:hover {
    background: ${theme.main};
    color: ${theme.white};
  }
  &:disabled {
    background: none;
    border: 1px solid #ccc;
    color: #ccc;
    cursor: not-allowed;
  }
`;

export default IncrementorSmall;