import React, { forwardRef } from 'react';
import { Field as FormikField, FieldProps } from 'formik';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import InputSpinner from '@/components/elements/InputSpinner';

interface SpinnerFieldProps {
    id: string;
    name: string;
    label?: string;
    description?: string;
    light?: boolean;
    isLoading?: boolean;
    validate?: (value: any) => undefined | string | Promise<any>;
    [key: string]: any;
}

const SpinnerField = forwardRef<HTMLInputElement, SpinnerFieldProps>(
    ({ id, name, label, description, light = false, isLoading = false, validate, ...props }, ref) => (
        <FormikField innerRef={ref} name={name} validate={validate}>
            {({ field, form: { errors } }: FieldProps) => (
                <div>
                    {label && (
                        <Label htmlFor={id} isLight={light}>
                            {label}
                        </Label>
                    )}
                    <InputSpinner visible={isLoading}>
                        <Input id={id} {...field} {...props} isLight={light} hasError={!!errors[field.name]} />
                    </InputSpinner>
                    {errors[field.name] ? (
                        <p className={'input-help error'}>
                            {(errors[field.name] as string).charAt(0).toUpperCase() +
                                (errors[field.name] as string).slice(1)}
                        </p>
                    ) : description ? (
                        <p className={'input-help'}>{description}</p>
                    ) : null}
                </div>
            )}
        </FormikField>
    )
);

SpinnerField.displayName = 'SpinnerField';

export default SpinnerField;
