import { Match } from "../src/services/cricApi";

export function processCricbuzzMatches(data: any): Match[] {
  const matches: Match[] = [];
  
  data.typeMatches?.forEach((type: any) => {
    type.seriesMatches?.forEach((series: any) => {
      series.seriesAdWrapper?.matches?.forEach((m: any) => {
        const info = m.matchInfo;
        const score = m.matchScore;
        
        const batTeamId = info.currBatTeamId;
        const isTeam1Batting = info.team1.teamId === batTeamId;
        
        // Helper to get the most recent innings
        const getLatestInnings = (teamScore: any) => {
          if (!teamScore) return null;
          return teamScore.inngs2 || teamScore.inngs1;
        };

        const t1 = getLatestInnings(score?.team1Score);
        const t2 = getLatestInnings(score?.team2Score);
        
        const s1Str = t1 ? ` ${t1.runs}/${t1.wickets || 0} (${t1.overs} ov)${isTeam1Batting ? "*" : ""}` : "";
        const s2Str = t2 ? ` ${t2.runs}/${t2.wickets || 0} (${t2.overs} ov)${!isTeam1Batting ? "*" : ""}` : "";
        
        const t1Full = `${info.team1.teamName}${s1Str}`;
        const t2Full = `${info.team2.teamName}${s2Str}`;

        let desc = "";
        if (score) {
          const s1Desc = t1 ? `${info.team1.teamName} ${t1.runs}/${t1.wickets || 0} (${t1.overs} ov)` : "";
          const s2Desc = t2 ? `${info.team2.teamName} ${t2.runs}/${t2.wickets || 0} (${t2.overs} ov)` : "";
          desc = isTeam1Batting ? `${s1Desc}${s2Desc ? " vs " + s2Desc : ""}` : `${s2Desc}${s1Desc ? " vs " + s1Desc : ""}`;
        } else {
          desc = info.status || "Match yet to start";
        }

        matches.push({
          id: info.matchId?.toString() || "",
          title: `${t1Full} vs ${t2Full}`,
          url: `https://www.cricbuzz.com/live-cricket-scores/${info.matchId}`,
          description: desc,
          matchId: info.matchId?.toString(),
          seriesId: info.seriesId?.toString(),
          team1Id: info.team1?.teamId?.toString(),
          team2Id: info.team2?.teamId?.toString(),
          team1: {
            name: info.team1.teamName,
            runs: t1?.runs,
            wickets: t1?.wickets,
            overs: t1?.overs?.toString(),
            isBatting: isTeam1Batting
          },
          team2: {
            name: info.team2.teamName,
            runs: t2?.runs,
            wickets: t2?.wickets,
            overs: t2?.overs?.toString(),
            isBatting: !isTeam1Batting
          },
          status: info.status
        });
      });
    });
  });

  return matches;
}
