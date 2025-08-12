/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { connect, mapReadPretty, observer, useField, useFieldSchema } from '@formily/react';
import { useCollection, useCollectionRecord } from '@nocobase/client';
import { ModalDualPanelSelector } from './ModalDualPanelSelector';
import { DualPanelSelectorCommonProps } from './utils';

interface DualPanelSelectorProps {
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  leftTitle?: string;
  rightTitle?: string;
}

const DualPanelSelectorEditable: FC<DualPanelSelectorProps> = observer(
  ({ value, onChange, placeholder, leftTitle, rightTitle }) => {
    // Hooks
    const field = useField();
    const fieldSchema = useFieldSchema();
    const collection = useCollection();
    const record = useCollectionRecord();

    // Get configuration from schema or use defaults
    const leftTitleConfig = useMemo(() => {
      return fieldSchema['x-component-props']?.leftTitle || field?.componentProps?.leftTitle || leftTitle || 'Menu';
    }, [fieldSchema, field, leftTitle]);

    const rightTitleConfig = useMemo(() => {
      return fieldSchema['x-component-props']?.rightTitle || field?.componentProps?.rightTitle || rightTitle || 'Buttons';
    }, [fieldSchema, field, rightTitle]);

    // Get association field information
    const collectionField = useMemo(() => {
      if (!collection || !fieldSchema) return null;
      return collection.getField(fieldSchema['name']) || collection.getField(fieldSchema['x-collection-field']);
    }, [collection, fieldSchema]);

    // Check if field is required
    const isRequired = useMemo(() => {
      if (fieldSchema?.required) return true;
      if (field?.['required']) return true;
      return false;
    }, [fieldSchema, field]);

    // Error check
    if (!collectionField?.target) {
      console.warn('DualPanelSelector: No associated field configuration or target table', {
        fieldSchema: fieldSchema?.name,
        collectionField,
      });
    }

    // Common props for the selector
    const commonProps: DualPanelSelectorCommonProps = {
      value,
      onChange,
      placeholder,
      leftTitle: leftTitleConfig,
      rightTitle: rightTitleConfig,
      collectionField,
      isRequired,
      collection,
      record,
    };

    return <ModalDualPanelSelector {...commonProps} />;
  },
);

const DualPanelSelectorReadPretty: FC<any> = ({ value, ...otherProps }) => {
  return <span>{value || '-'}</span>;
};

export const DualPanelSelector: FC<any> = connect(DualPanelSelectorEditable, mapReadPretty(DualPanelSelectorReadPretty));

DualPanelSelector.displayName = 'DualPanelSelector';
