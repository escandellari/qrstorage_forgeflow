import {
  createBoxDetailsDraft,
  getBoxDetails,
  updateBoxDetails,
} from './boxDetailsService';

const singleMock = vi.fn();
const selectMock = vi.fn();
const secondEqMock = vi.fn();
const firstEqMock = vi.fn();
const updateMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/src/features/auth/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    from: fromMock,
  }),
}));

describe('boxDetailsService', () => {
  beforeEach(() => {
    singleMock.mockReset();
    selectMock.mockReset();
    secondEqMock.mockReset();
    firstEqMock.mockReset();
    updateMock.mockReset();
    fromMock.mockReset();
  });

  it('loads a box by workspace and stable box ID', async () => {
    secondEqMock.mockResolvedValue({
      data: [
        {
          id: 'box-row-1',
          workspace_id: 'workspace-1',
          box_id: 'BOX-0001',
          name: 'Winter clothes',
          location: 'Hall cupboard',
          notes: 'Coats and hats',
          label_target: 'Front handle',
        },
      ],
      error: null,
    });
    firstEqMock.mockReturnValue({
      eq: secondEqMock,
    });
    selectMock.mockReturnValue({
      eq: firstEqMock,
    });
    fromMock.mockReturnValue({
      select: selectMock,
    });

    await expect(getBoxDetails('workspace-1', 'BOX-0001')).resolves.toEqual({
      id: 'box-row-1',
      workspaceId: 'workspace-1',
      boxId: 'BOX-0001',
      name: 'Winter clothes',
      location: 'Hall cupboard',
      notes: 'Coats and hats',
      labelTarget: 'Front handle',
    });
    expect(selectMock).toHaveBeenCalledWith(
      'id, workspace_id, box_id, name, location, notes, label_target',
    );
    expect(firstEqMock).toHaveBeenCalledWith('workspace_id', 'workspace-1');
    expect(secondEqMock).toHaveBeenCalledWith('box_id', 'BOX-0001');
  });

  it('updates box details and normalises blank values to null', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'box-row-1',
        workspace_id: 'workspace-1',
        box_id: 'BOX-0001',
        name: 'Winter coats',
        location: null,
        notes: 'Heavy jackets only',
        label_target: null,
      },
      error: null,
    });
    selectMock.mockReturnValue({
      single: singleMock,
    });
    secondEqMock.mockReturnValue({
      select: selectMock,
    });
    firstEqMock.mockReturnValue({
      eq: secondEqMock,
    });
    updateMock.mockReturnValue({
      eq: firstEqMock,
    });
    fromMock.mockReturnValue({
      update: updateMock,
    });

    await expect(
      updateBoxDetails('workspace-1', 'BOX-0001', {
        name: 'Winter coats',
        location: '   ',
        notes: 'Heavy jackets only',
        labelTarget: '',
      }),
    ).resolves.toEqual({
      id: 'box-row-1',
      workspaceId: 'workspace-1',
      boxId: 'BOX-0001',
      name: 'Winter coats',
      location: null,
      notes: 'Heavy jackets only',
      labelTarget: null,
    });
    expect(updateMock).toHaveBeenCalledWith({
      name: 'Winter coats',
      location: null,
      notes: 'Heavy jackets only',
      label_target: null,
    });
    expect(firstEqMock).toHaveBeenCalledWith('workspace_id', 'workspace-1');
    expect(secondEqMock).toHaveBeenCalledWith('box_id', 'BOX-0001');
    expect(selectMock).toHaveBeenCalledWith(
      'id, workspace_id, box_id, name, location, notes, label_target',
    );
  });

  it('creates an editable draft from nullable saved values', () => {
    expect(
      createBoxDetailsDraft({
        id: 'box-row-1',
        workspaceId: 'workspace-1',
        boxId: 'BOX-0001',
        name: null,
        location: 'Hall cupboard',
        notes: null,
        labelTarget: null,
      }),
    ).toEqual({
      name: '',
      location: 'Hall cupboard',
      notes: '',
      labelTarget: '',
    });
  });
});
