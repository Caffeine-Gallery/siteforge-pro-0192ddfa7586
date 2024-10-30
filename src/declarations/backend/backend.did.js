export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'loadDesign' : IDL.Func([], [IDL.Opt(IDL.Text)], []),
    'principalToText' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'publishDesign' : IDL.Func([IDL.Text], [IDL.Text], []),
    'saveDesign' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
