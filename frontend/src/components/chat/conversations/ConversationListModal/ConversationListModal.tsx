import { useLazyQuery, useMutation } from '@apollo/client';
import * as React from 'react';
import { FormEvent, useState } from 'react';
import {
  CreateConversationResponseData,
  CreateConversationVariables,
  SearchedUser,
  SearchUsersData,
  SearchUsersInput,
} from '../../../../utils/types';
import Modal from '../Modal/Modal';
import SearchUsersList from './SearchedUsersList';
import UserOperations from '../../../../graphql/operations/user';
import ConversationOperations from '../../../../graphql/operations/conversation';
import ParticipantList from './ParticipantsList';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface IConversationModalProps {
  close: () => void;
}

const ConversationModal: React.FunctionComponent<IConversationModalProps> = ({
  close,
}) => {
  const [username, setUsername] = useState<string>('');
  const [participants, setParticipants] = useState<Array<SearchedUser>>([]);
  const [searchUsers, { data, error, loading }] = useLazyQuery<
    SearchUsersData,
    SearchUsersInput
  >(UserOperations.Queries.searchUsers);

  const [createConversation] = useMutation<
    CreateConversationResponseData,
    CreateConversationVariables
  >(ConversationOperations.Mutations.createConversation);

  const handleFindUser = (e: FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    searchUsers({
      variables: { searchedUsername: cleanUsername },
      context: {},
    });
  };

  const addParticipant = (user: SearchedUser) => {
    const existingParticipant = participants.find((p) => p.id === user.id);
    if (existingParticipant) return;
    setParticipants((prevParticipants) => [...prevParticipants, user]);
  };
  const removeParticipant = (user: SearchedUser) => {
    setParticipants((prevParticipants) => {
      const listWithRemovedParticipant = prevParticipants.filter(
        (p) => p.id !== user.id
      );
      return [...listWithRemovedParticipant];
    });
  };
  const { data: session } = useSession();
  const handleCreateConversation = async () => {
    try {
      // create conversation mutation
      const participantIds = [
        ...participants.map((p) => p.id),
        session?.user?.id as string,
      ];
      const newConversation = await createConversation({
        variables: { participantIds: participantIds },
      });
      console.log('Creating new conversation');
    } catch (error: any) {
      console.log('Create conversation error ', error.message);
      toast.error(error.message);
    }
  };

  return (
    <Modal
      close={close}
      className='bg-neutral-800 h-fit w-full max-w-lg  rounded-lg'
    >
      <div className='w-full p-8 flex flex-col gap-8'>
        <form onSubmit={handleFindUser} className=' flex flex-col gap-4'>
          <input
            type='text'
            placeholder='Enter a username'
            className='w-full bg-neutral-800 border-2 border-neutral-600 outline-none p-2 rounded'
            onChange={(e) => setUsername(e.target.value)}
            value={username}
          />
          <button
            type='submit'
            className={`w-full p-4 text-lg font-bold bg-neutral-700 rounded ${
              !username
                ? 'text-neutral-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 transition-all duration-200'
            }`}
            disabled={!username}
          >
            Submit
          </button>
        </form>
        {data?.searchUsers && (
          <SearchUsersList
            users={data.searchUsers}
            addParticipant={addParticipant}
          />
        )}
        {participants.length > 0 && (
          <>
            <ParticipantList
              users={participants}
              removeParticipant={removeParticipant}
            />
            <button
              onClick={handleCreateConversation}
              className='bg-blue-600 p-2 rounded'
            >
              Create conversation
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ConversationModal;
