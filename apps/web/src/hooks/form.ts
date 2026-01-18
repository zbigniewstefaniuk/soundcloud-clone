import { createFormHook } from '@tanstack/react-form';

import {
  Select,
  SubmitButton,
  TextArea,
  TextField,
  Switch,
  AudioFileField,
  ImageFileField,
} from '../components/form-components.tsx';

import { fieldContext, formContext } from './form-context';

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
    Switch,
    AudioFileField,
    ImageFileField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
