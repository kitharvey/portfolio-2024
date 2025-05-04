# I Built a Ridiculous App to Rank Pokémon Roundness

## Why Did I Do This?
I saw [this YouTube guy](https://www.youtube.com/watch?v=vP3QVrveSvI) nerd out over which Pokémon is the roundest, and I thought, “Great, now I have to build that.” So I made an app where you pick the rounder Pokémon from two options. It’s a gloriously pointless project, but I got to play with SvelteKit and Cloudflare’s stack, so I’m not *entirely* embarrassed.

## What’s It Do?
You look at two Pokémon, click the one that’s more of a meatball. It pulls data from the PokéAPI, stores votes and Pokémon details in a database, and shows a leaderboard of the roundest champs. Works on your phone, laptop, whatever. Hasn’t caught fire yet, which is a win.

## Tech Stack
Here’s the junk I used to make this happen:
- **SvelteKit**: Runs front-end and server-side. It’s not terrible.
- **TypeScript**: Keeps my code from being a total trainwreck.
- **PokéAPI**: Grabs Pokémon data so I don’t have to make it up.
- **Drizzle ORM**: Makes database queries bearable.
- **Cloudflare D1**: Tiny database for storing votes and Pokémon details.
- **CSS**: Basic styling, no one’s winning awards here.
- **Cloudflare Pages**: Deploys faster than I can regret this.
- **Cloudflare Image Transform**: Shrinks images so they don’t kill your data.
- **Better-auth**: Handles logins without driving me insane.

## Features
- Vote on which Pokémon is rounder.
- Leaderboard of the chunkiest Pokémon.
- Looks decent on any screen.
- Doesn’t choke when you mash the vote button.

## Screenshots
![Screenshot of roundest app landing page in large screen](/screenshots/roundest/large-index.png)
![Screenshot of roundest app vote page in large screen](/screenshots/roundest/large-vote.png)
![Screenshot of roundest app results page in large screen](/screenshots/roundest/large-results.png)
![Screenshot of roundest app landing page in mobile screen](/screenshots/roundest/small-index.png)
![Screenshot of roundest app vote page in mobile screen](/screenshots/roundest/small-vote.png)
![Screenshot of roundest app results page in mobile screen](/screenshots/roundest/small-results.png)

## The Guts
The voting system’s the main thing. I load three Pokémon pairs to start, then fetch one new pair per vote, yeeting the oldest. Keeps it snappy. SvelteKit’s actions handle vote submissions, which is less miserable than expected.

Here’s the function that grabs random Pokémon pairs and tries not to break:

```typescript
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { pokemon as pokemonSchema } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { Matchup } REGEX'types';

export async function getMatchupsOptimized(
  db: DrizzleD1Database,
  matchupCount = 1
): Promise<Matchup[]> {
  const matchups: Matchup[] = [];
  const totalPokemonNeeded = matchupCount * 2;

  if (totalPokemonNeeded <= 0) {
    return [];
  }

  try {
    const randomPokemonList = await db
      .select()
      .from(pokemonSchema)
      .orderBy(sql`RANDOM()`)
      .limit(totalPokemonNeeded);

    const actualPokemonFetched = randomPokemonList.length;

    if (actualPokemonFetched < 2) {
      console.warn(`Only got ${actualPokemonFetched} Pokémon, not enough for a matchup.`);
      return [];
    }

    const possibleMatchups = Math.floor(actualPokemonFetched / 2);

    for (let i = 0; i < possibleMatchups; i++) {
      if (matchups.length >= matchupCount) {
        break;
      }

      const pokemon1 = randomPokemonList[i * 2];
      const pokemon2 = randomPokemonList[i * 2 + 1];

      if (pokemon1.id === pokemon2.id) {
        console.warn(
          `Duplicate Pokémon ID ${pokemon1.id} in pair. Skipping this one.`
        );
        continue;
      }

      matchups.push({ pokemon1, pokemon2 });
    }

    if (matchups.length < matchupCount) {
      console.warn(
        `Only made ${matchups.length} matchups, wanted ${matchupCount}. ` +
        `DB had ${actualPokemonFetched} Pokémon, might’ve hit duplicates.`
      );
    }
  } catch (error) {
    console.error('Database crapped out:', error);
    throw new Error('Couldn’t fetch Pokémon matchups.', { cause: error });
  }

  return matchups;
}
```

Server-side vote handling:

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Actions, PageServerLoad } from './$types';
import { votes as votesSchema } from '$lib/server/db/schema';
import { getMatchupsOptimized } from '$lib/workers/getMatchupsOptimize';

export const load: PageServerLoad = async ({ locals: { db } }) => {
  const matchups = await getMatchupsOptimized(db, 3);
  return { matchups };
};

export const actions: Actions = {
  default: async ({ request, locals: { db } }) => {
    const data = await request.formData();
    const winnerId = Number(data.get('winner_id'));
    const pokemon1Id = Number(data.get('pokemon1_id'));
    const pokemon2Id = Number(data.get('pokemon2_id'));

    if (isNaN(winnerId) || isNaN(pokemon1Id) || isNaN(pokemon2Id)) {
      return { success: false, error: 'Invalid input data' };
    }

    const loserId = winnerId === pokemon1Id ? pokemon2Id : pokemon1Id;

    try {
      const [_, matchup] = await Promise.all([
        db.insert(votesSchema).values([
          { pokemonId: winnerId, voteType: 'win' },
          { pokemonId: loserId, voteType: 'loss' }
        ]),
        getMatchupsOptimized(db, 1)
      ]);
      return { success: true, matchup };
    } catch (error) {
      console.error('Vote recording failed:', error);
      return { success: false, error: 'Failed to record vote' };
    }
  }
};
```

Front-end voting UI, showing only the active pair:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import Card from '$lib/components/app/Card.svelte';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { PageProps } from './$types';
  import type { Matchup } from '$lib/types';

  let { data }: PageProps = $props();
  let matchups = $state(data.matchups);
  let mainRef = $state<HTMLElement | null>(null);
  let disabled = $state(false);

  const voteEnhance: SubmitFunction = async () => {
    disabled = true;
    return async ({ result }) => {
      if (result.type === 'success') {
        const newMatchup = result?.data?.matchup as Matchup[];
        matchups = [...matchups, ...newMatchup];
        matchups.shift();
      }

      disabled = false;
      await tick();
      mainRef?.focus();
    };
  };
</script>

<div class="page">
  <header>
    <h1>Who's Rounder?</h1>
    <p class="subtitle">Pick the roundest Pokémon.</p>
  </header>
  <section class="instructions" aria-labelledby="instructions-heading">
    <h2 id="instructions-heading" class="visually-hidden">Instructions</h2>
    <p>Click the rounder Pokémon. Help settle this pointless argument.</p>
  </section>
  <div bind:this={mainRef} tabindex="-1">
    <div class="matchups-container">
      {#if matchups.length > 0}
        {#each matchups as matchup, index (matchup.pokemon1.id + '-' + matchup.pokemon2.id + '-' + index)}
          <div class="matchup" style:display={index === 0 ? null : 'none'}>
            <form method="POST" use:enhance={voteEnhance}>
              <input type="hidden" name="pokemon1_id" value={matchup.pokemon1.id} />
              <input type="hidden" name="pokemon2_id" value={matchup.pokemon2.id} />
              <div class="matchup-buttons">
                <button
                  type="submit"
                  name="winner_id"
                  value={matchup.pokemon1.id}
                  disabled={index !== 0 || disabled}
                  aria-label={`Vote for ${matchup.pokemon1.name}`}
                >
                  <Card pokemon={matchup.pokemon1} className="mobile" />
                </button>
                <div class="vs" aria-hidden="true">VS</div>
                <button
                  type="submit"
                  name="winner_id"
                  value={matchup.pokemon2.id}
                  disabled={index !== 0 || disabled}
                  aria-label={`Vote for ${matchup.pokemon2.name}`}
                >
                  <Card pokemon={matchup.pokemon2} className="mobile" />
                </button>
              </div>
            </form>
          </div>
        {/each}
      {:else}
        <p>No more Pokémon. Go do something useful.</p>
      {/if}
    </div>
  </div>
</div>
```

## Image Optimization
The [original video](https://www.youtube.com/watch?v=vP3QVrveSvI) used low-res Pokémon sprites, which look like pixelated garbage on modern screens. Here's one for Bulbasaur (96x96, 0.5KB):

![Low-res Bulbasaur sprite](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png)

I went with higher-quality official artwork for better visuals. Here's Bulbasaur again (475x475, 203KB):

![Official Bulbasaur artwork](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png)

I downloaded these locally and uploaded them to my repo. Here's the repo-hosted version (475x475, 203KB):

![Repo-hosted Bulbasaur artwork](https://roundest.kitharvey.dev/pokemon/1.png)

Then I used **Cloudflare Image Transform** to optimize them on the fly. Here's the optimized version (200x200, 6.6KB):

![Cloudflare-optimized Bulbasaur artwork](https://roundest.kitharvey.dev/cdn-cgi/image/width=200,height=200,fit=scale-down,compression=fast,slow-connection-quality=50,quality=70,format=webp/pokemon%2F1.png)

This keeps images crisp but lightweight, even on slow connections.

## What I Got Out of It
I learned how to wire up **Cloudflare D1**, **Drizzle ORM**, and **SvelteKit**, then fling it all onto **Cloudflare Pages**. D1’s a compact SQL database that’s absurdly fast for small apps like this, perfect for storing votes and Pokémon details without needing a PhD in database admin. You set it up in Cloudflare’s dashboard, bind it to your project, and it just works. Drizzle ORM is a TypeScript ORM that doesn’t suck—it makes querying D1 feel almost pleasant with a clean API for migrations and queries. Hooking it into SvelteKit took some trial and error, mostly around server routes and environment bindings, but once it clicked, it was a breeze. Cloudflare Pages is brain-dead simple for deployment—push to Git, and it builds and hosts your SvelteKit app like it’s no big deal. The whole stack plays together so well it’s almost suspicious.

## Docs I Used
- **[SvelteKit with Drizzle and Cloudflare D1](https://www.geekytidbits.com/sveltekit-with-drizzle-and-cloudflare-d1/)**: A solid guide for setting up SvelteKit with Drizzle ORM and Cloudflare D1. It walks through creating a D1 database, configuring Drizzle, and integrating it with SvelteKit’s server routes. Has code snippets for migrations and queries, but you need to know your way around a bit.
- **[Cloudflare D1 Get Started](https://developers.cloudflare.com/d1/get-started/)**: Cloudflare’s official D1 docs. Covers creating and managing a D1 database via the dashboard or Wrangler CLI. It’s clear, with steps for setup, bindings, and basic SQL. Good for starting, but you’ll need more for complex stuff.
- **[Better-auth Installation](https://better-auth.vercel.app/docs/installation)**: Instructions for setting up Better-auth for authentication. Supports SvelteKit and providers like Google or GitHub. It’s short and to the point, covering installation, config, and auth routes. Does what it says, no fluff.

## Try It
Go to [the app](https://roundest.kitharvey.pages.dev/) and vote on some round Pokémon. Or check the [GitHub repo](https://github.com/kitharvey/roundest) if you’re into code. Which Pokémon’s the roundest? I don’t care, but tell me anyway.