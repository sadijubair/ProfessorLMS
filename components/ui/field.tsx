'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field" className={cn('grid gap-2', className)} {...props} />;
}

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return <fieldset data-slot="field-set" className={cn('grid gap-3', className)} {...props} />;
}

function FieldLegend({ className, ...props }: React.ComponentProps<'legend'>) {
  return <legend data-slot="field-legend" className={cn('text-sm font-medium', className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return <label data-slot="field-label" className={cn('text-sm font-medium', className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p data-slot="field-description" className={cn('text-xs text-muted-foreground', className)} {...props} />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-group" className={cn('grid gap-3', className)} {...props} />;
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet };