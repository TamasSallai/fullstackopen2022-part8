import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../query'
import { useState } from 'react'

const Books = (props) => {
  const { loading, data } = useQuery(ALL_BOOKS)
  const [genreFilter, setGenreFilter] = useState('all genres')

  if (!props.show) {
    return null
  }

  if (loading) {
    return <div>loading...</div>
  }

  const books = data.allBooks || []

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books
            .filter((b) =>
              genreFilter === 'all genres'
                ? true
                : b.genres.includes(genreFilter)
            )
            .map((b) => (
              <tr key={b.title}>
                <td>{b.title}</td>
                <td>{b.author.name}</td>
                <td>{b.published}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => setGenreFilter('refactoring')}>
          refactoring
        </button>
        <button onClick={() => setGenreFilter('agile')}>agile</button>
        <button onClick={() => setGenreFilter('patterns')}>patterns</button>
        <button onClick={() => setGenreFilter('design')}>design</button>
        <button onClick={() => setGenreFilter('crime')}>crime</button>
        <button onClick={() => setGenreFilter('classic')}>classic</button>
        <button onClick={() => setGenreFilter('all genres')}>all genres</button>
      </div>
    </div>
  )
}

export default Books
