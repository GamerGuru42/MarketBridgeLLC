-- RLS Policy for Admins to Read All Users
CREATE POLICY "Admin read all users" ON public.users
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('admin', 'ceo', 'technical_admin', 'operations_admin', 'marketing_admin')
  )
);

-- RLS Policy for Admins to Update Reviews (status)
CREATE POLICY "Admin update reviews" ON public.reviews
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('admin', 'ceo', 'technical_admin', 'operations_admin', 'marketing_admin')
  )
);
