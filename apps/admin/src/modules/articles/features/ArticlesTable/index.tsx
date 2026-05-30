import {
  Box, Chip, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import StarIcon from '@mui/icons-material/Star';
import type { Article } from '../../domain/types';

export const MAX_FEATURED_ARTICLES = 3;

interface ArticlesTableProps {
  data: Article[];
  role: 'admin' | 'editor' | 'groomer';
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onPublish: (article: Article) => void;
}

const statusChip = (status: Article['status']) =>
  status === 'published'
    ? <Chip label="Опубликована" size="small" color="success" variant="outlined" />
    : <Chip label="Черновик" size="small" variant="outlined" />;

const featuredChip = (compact = false) => {
  const chip = (
    <Chip
      icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
      label={compact ? ' ' : 'На главной'}
      size="small"
      color="warning"
      variant="outlined"
      sx={compact ? {
        height: 24,
        '& .MuiChip-label': { width: 0, p: 0, overflow: 'hidden' },
        '& .MuiChip-icon': { m: 0, ml: '6px !important' },
      } : undefined}
    />
  );

  return compact ? <Tooltip title="На главной">{chip}</Tooltip> : chip;
};

export function ArticlesTable({ data, role, onEdit, onDelete, onPublish }: ArticlesTableProps) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  if (data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Статьи не добавлены
      </Typography>
    );
  }

  const canEdit = (a: Article) => role === 'admin' || a.status === 'draft';
  const canDelete = (a: Article) => role === 'admin' || a.status === 'draft';

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((article) => (
          <Paper key={article.id} sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                fontWeight={600}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {article.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                {article.animal_name ?? '—'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
                {statusChip(article.status)}
                {role === 'admin' && article.featured && featuredChip(true)}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexShrink: 0, gap: 0.25 }}>
            {canEdit(article) && (
              <Tooltip title="Редактировать">
                <IconButton size="small" onClick={() => onEdit(article)}><EditIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            {role === 'admin' && (
              <Tooltip title={article.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}>
                <IconButton size="small" color="primary" onClick={() => onPublish(article)}>
                  {article.status === 'published' ? <UnpublishedIcon fontSize="small" /> : <PublishIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            {canDelete(article) && (
              <Tooltip title="Удалить">
                <IconButton size="small" color="error" onClick={() => onDelete(article)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Заголовок', 'Животное', 'Статус', ...(role === 'admin' ? ['На главной'] : []), ''].map((h) => (
                <TableCell key={h || 'actions'} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((article) => (
              <TableRow key={article.id} hover>
                <TableCell>{article.title}</TableCell>
                <TableCell>{article.animal_name ?? '—'}</TableCell>
                <TableCell>{statusChip(article.status)}</TableCell>
                {role === 'admin' && (
                  <TableCell>{article.featured ? featuredChip() : '—'}</TableCell>
                )}
                <TableCell width={130}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {canEdit(article) && (
                      <Tooltip title="Редактировать">
                        <IconButton size="small" onClick={() => onEdit(article)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {role === 'admin' && (
                      <Tooltip title={article.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}>
                        <IconButton size="small" color="primary" onClick={() => onPublish(article)}>
                          {article.status === 'published' ? <UnpublishedIcon fontSize="small" /> : <PublishIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete(article) && (
                      <Tooltip title="Удалить">
                        <IconButton size="small" color="error" onClick={() => onDelete(article)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
