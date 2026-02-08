-- Enable messaging features by adding RLS policies for conversations and messages

-- Conversations: Users can select conversations they're part of
create policy "Users can view their conversations"
  on conversations for select
  using (
    auth.uid() = participant_a_id OR auth.uid() = participant_b_id
  );

-- Conversations: Users can create conversations they're part of
create policy "Users can create conversations"
  on conversations for insert
  with check (
    auth.uid() = participant_a_id OR auth.uid() = participant_b_id
  );

-- Conversations: Users can update conversations they're part of
create policy "Users can update their conversations"
  on conversations for update
  using (
    auth.uid() = participant_a_id OR auth.uid() = participant_b_id
  );

-- Messages: Users can select messages from their conversations
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and (conversations.participant_a_id = auth.uid() or conversations.participant_b_id = auth.uid())
    )
  );

-- Messages: Users can insert messages to their conversations
create policy "Users can send messages to their conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations
      where conversations.id = conversation_id
      and (conversations.participant_a_id = auth.uid() or conversations.participant_b_id = auth.uid())
    )
  );

-- Messages: Users can update their own messages (for "read" status etc)
create policy "Users can mark messages as read in their conversations"
  on messages for update
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and (conversations.participant_a_id = auth.uid() or conversations.participant_b_id = auth.uid())
    )
  );
