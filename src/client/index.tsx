/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import {
  Plugin,
} from '@nocobase/client';
import { tval } from '@nocobase/utils/client';
import { DualPanelSelector } from './DualPanelSelector';
import { ModalDualPanelSelector } from './ModalDualPanelSelector';
import { NAMESPACE } from './constant';
import { DualPanelSelectorConfigEditor } from './DualPanelSelectorSettings';

class PluginDualPanelSelector extends Plugin {
  async load() {
    // Register main components
    this.app.addComponents({ 
      DualPanelSelector,
      ModalDualPanelSelector,
    });

    // extends CollectionFieldInterface
    const interfaces = ['o2o', 'o2m', 'm2m'];
    interfaces.forEach((interfaceName) => {
      this.app.addFieldInterfaceComponentOption(interfaceName, {
        label: tval('Dual Panel Selector', { ns: NAMESPACE }),
        value: 'DualPanelSelector',
      });
    });

    // Custom Selector configuration setting
    this.app.schemaSettingsManager.addItem('fieldSettings:FormItem', 'dualPanelSelectorConfig', {
      type: 'item',
      useVisible() {
        const fieldSchema = useFieldSchema();
        // Only show when Custom Selector is enabled
        return fieldSchema['x-component-props']?.component === 'DualPanelSelector';
      },
      Component: DualPanelSelectorConfigEditor,
    });
  }
}

export default PluginDualPanelSelector;
