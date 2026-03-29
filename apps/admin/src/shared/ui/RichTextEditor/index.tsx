import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Divider, IconButton, Paper, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import './styles.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  error?: boolean;
}

export function RichTextEditor({ value, onChange, error }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    active: boolean,
  ) => (
    <Tooltip title={label} key={label}>
      <IconButton
        size="small"
        onMouseDown={(e) => { e.preventDefault(); action(); }}
        color={active ? 'primary' : 'default'}
        sx={{ borderRadius: 1 }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          bgcolor: 'grey.50',
          flexWrap: 'wrap',
        }}
      >
        {btn('Заголовок H1', <b style={{ fontSize: 13 }}>H1</b>,
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          editor.isActive('heading', { level: 1 }),
        )}
        {btn('Заголовок H2', <b style={{ fontSize: 13 }}>H2</b>,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive('heading', { level: 2 }),
        )}
        {btn('Заголовок H3', <b style={{ fontSize: 13 }}>H3</b>,
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          editor.isActive('heading', { level: 3 }),
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {btn('Жирный', <FormatBoldIcon fontSize="small" />,
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive('bold'),
        )}
        {btn('Курсив', <FormatItalicIcon fontSize="small" />,
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive('italic'),
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {btn('Маркированный список', <FormatListBulletedIcon fontSize="small" />,
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive('bulletList'),
        )}
        {btn('Нумерованный список', <FormatListNumberedIcon fontSize="small" />,
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive('orderedList'),
        )}
      </Box>

      <Divider />

      {/* Editor area */}
      <Box sx={{ px: 2, py: 1.5, minHeight: 240 }} className="tiptap-editor">
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}
