"""
utility functions for supporting OpenMDAO in Atom
"""

def Script():
    """ similar to Jedi Script class for providing autocomplete suggestions

    TODO: just extend the Jedi class

    You can either use the ``source`` parameter or ``path`` to read a file.
    Usually you're going to want to use both of them (in an editor).

    :param source: The source code of the current file, separated by newlines.
    :type source: str
    :param line: The line to perform actions on (starting with 1).
    :type line: int
    :param col: The column of the cursor (starting with 0).
    :type col: int
    :param path: The path of the file in the file system, or ``''`` if
        it hasn't been saved yet.
    :type path: str or None
    :param encoding: The encoding of ``source``, if it is not a
        ``unicode`` object (default ``'utf-8'``).
    :type encoding: str
    """
    def __init__(self, source=None, line=None, column=None, path=None, encoding='utf-8'):
        self._orig_path = path
        self.path = None if path is None else os.path.abspath(path)

        if source is None:
            with open(path) as f:
                source = f.read()

        self.source = common.source_to_unicode(source, encoding)

    def completions(self):
        """
        Return :class:`classes.Completion` objects. Those objects contain
        information about the completions, more than just names.

        :return: Completion objects, sorted by name and __ comes last.
        :rtype: list of :class:`classes.Completion`
        """
        return {
            "name": "DUMMY name",
            "description": "DUMMY description",
            "docstring": "DUMMY docstring"
        }
