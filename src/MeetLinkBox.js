import React from "react";
import { TextField, Button, Grid, Container, Paper } from "@mui/material";

const MeetLinkBox = ({ meetLink, onCopyLink }) => {
  return (
    <Container maxWidth='md'>
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        <Grid container spacing={2} alignItems='center' justifyContent='center'>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant='outlined'
              label='Meet Link'
              value={meetLink}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item>
            <Button variant='contained' color='primary' onClick={onCopyLink}>
              Copy Link
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default MeetLinkBox;
