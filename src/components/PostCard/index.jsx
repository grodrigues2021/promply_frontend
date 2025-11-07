import MediaRenderer from './MediaRenderer';
import ActionsBar from './ActionsBar';
import CommentsSection from './CommentsSection';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();

  const isAuthor = user?.id === post.author?.id;
  const canDelete = isAuthor || user?.is_admin;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col gap-3">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-800">{post.author?.name || 'Usuário'}</p>
          <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
        </div>
        {canDelete && (
          <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </header>

      <p className="text-gray-700 text-sm whitespace-pre-wrap">{post.content}</p>

      <MediaRenderer media={post.media} />

      <ActionsBar post={post} onUpdate={onUpdate} />

      <CommentsSection postId={post.id} />
    </div>
  );
};
