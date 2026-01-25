import { createFormHook } from '@tanstack/react-form'

import {
  Select,
  MultiSelect,
  SubmitButton,
  TextArea,
  TextField,
  Switch,
  AudioFileField,
  ImageFileField,
} from '../components/form-components.tsx'

import { fieldContext, formContext } from './form-context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    MultiSelect,
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
})
